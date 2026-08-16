// @jasper/dsh-plugin-petdex-market
//
// A DSH cordis bundle that provides a petdex marketplace as a Settings UI tab,
// plus the desktop-pet renderer:
//
//   1. Persists the user's installed-pet collection + desktop prefs into the
//      `petdex-market` settings namespace (survives restarts; hot-reloads).
//   2. Serves /petdex-market/* (market list, pets CRUD, sprite proxy, cache,
//      desktop config for the native renderer).
//   3. Enforces single-active-companion semantics: enabling a pet
//      disables every other; installing makes the new pet the active one.
//   4. Spawns/kills the native macOS pet renderer (petdex-renderer) based on
//      desktopEnabled + activePetId, and feeds it agent-activity states
//      (run while the agent works, wave + speech bubble when a reply lands).
import crypto from 'node:crypto';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import z from '@deepseek-ai/schemastery';
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings';
import {
  fetchPetdexManifest,
  fetchPetMeta,
  fetchMarketSprite,
  findManifestPet,
  clearPetdexCaches,
  setManifestTtl,
  fetchPetdexCatalog,
  hasPetdexCatalog,
  sortCatalogPets,
  PetdexInstalledPet,
  installedSpriteSrc,
  marketSpriteSrc,
} from './petdex.js';

const name = 'petdex-market';
// kebab-case required by DSH settings namespace validation.
const SETTINGS_NS = settingsNamespace('petdex-market');

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const DEFAULT_LIVELINESS = 0.6;
const CATALOG_TTL_MS = 900000;

const SETTINGS_SCHEMA = z.object({
  enabled: z.boolean().default(false),
  pets: z.array(z.any()).default([]),
  activePetId: z.string().default(''),
  pageSize: z.number().default(48),
  manifestTtlMs: z.number().default(300000),
  metaTtlMs: z.number().default(1800000),
  spriteTtlMs: z.number().default(600000),
  // Desktop-pet prefs.
  desktopEnabled: z.boolean().default(true),
  petScale: z.number().default(1),
  petLiveliness: z.number().default(DEFAULT_LIVELINESS),
  bubbleEnabled: z.boolean().default(true),
});

const PLUGIN_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RENDERER_BIN = path.join(PLUGIN_ROOT, 'petdex-renderer');

/** Concatenate the text blocks of an assistant/message event into one line. */
function assistantText(event) {
  const blocks = event.data?.message?.content ?? [];
  return blocks
    .filter((b) => b && b.type === 'text')
    .map((b) => String(b.text ?? ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const apply = (ctx, config) => {
  new PetdexMarketService(ctx, config || {});
};

class PetdexMarketService {
  /**
   * @param {any} ctx
   * @param {Record<string,any>} config
   */
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this._pets = [];
    this._activePetId = '';
    this._source = () => ({ pets: [], activePetId: '', ...config });
    this._webPort = null;
    this._child = null;
    this._activeTurns = new Set();
    this._turnBubble = new Map();
    this._lastEvent = { state: 'idle', at: 0, bubble: '' };

    setManifestTtl(Number(config.manifestTtlMs) || 300000);

    // Canonical DSH settings wiring: registers the `petdex-market` namespace
    // (writes persist to settings.yaml) and re-reads live on every change.
    installSettingsSection(ctx, SETTINGS_NS, SETTINGS_SCHEMA, {
      enabled: !!config.enabled,
      pets: [],
      activePetId: '',
      pageSize: Number(config.pageSize) || 48,
      manifestTtlMs: Number(config.manifestTtlMs) || 300000,
      metaTtlMs: Number(config.metaTtlMs) || 1800000,
      spriteTtlMs: Number(config.spriteTtlMs) || 600000,
      desktopEnabled: config.desktopEnabled !== false,
      petScale: Number(config.petScale) || 1,
      petLiveliness:
        typeof config.petLiveliness === 'number' ? config.petLiveliness : DEFAULT_LIVELINESS,
      bubbleEnabled: config.bubbleEnabled !== false,
    }, {
      setSource: (current) => { this._source = current; this._syncFromSource(); },
      onChange: () => this._syncFromSource(),
    });

    // Feed the desktop pet from agent activity: the pet runs for the whole
    // turn (agent working on one user message) and waves + pops a bubble once
    // when the turn completes. assistant/message only stages the bubble text
    // of its turn; turn/end is what triggers the wave, so a multi-step reply
    // (many assistant/message events) still waves exactly once.
    ctx.on('session/event', (session, event) => {
      if (!event || typeof event.type !== 'string') return;
      const sid = session && session.id ? session.id : 'default';
      if (event.type === 'turn/start') {
        this._activeTurns.add(sid);
        this._turnBubble.set(sid, '');
      } else if (event.type === 'assistant/message') {
        const text = assistantText(event);
        if (text) this._turnBubble.set(sid, text);
      } else if (event.type === 'turn/end') {
        this._activeTurns.delete(sid);
        const bubble = this._turnBubble.get(sid) ?? '';
        this._turnBubble.delete(sid);
        this._lastEvent = {
          state: 'wave',
          at: Date.now(),
          bubble: bubble.length > 120 ? bubble.slice(0, 119).trimEnd() + '…' : bubble,
        };
      }
    }, { global: true });

    ctx.inject(['webServer'], (sctx) => {
      sctx.effect(() => sctx.webServer.register({
        kind: 'prefix',
        path: '/petdex-market',
        handler: (req, res) => this.httpHandler(req, res),
      }), 'petdex-market: http api route');
      this._webPort = sctx.webServer?.port ?? null;
      this._reevaluateRenderer();
    });

    ctx.on('dispose', () => this._killRenderer());

    this.ctx.logger?.info?.('[petdex-market] service mounted (Settings tab + /petdex-market API + desktop renderer)');
  }

  // ── settings / renderer lifecycle ──

  _syncFromSource() {
    const s = this._source();
    if (s) {
      this._pets = Array.isArray(s.pets) ? s.pets : [];
      this._activePetId = s.activePetId || '';
    }
    this._reevaluateRenderer();
  }

  _activePetRecord() {
    const rec = this._pets.find((p) => p.id === this._activePetId && p.enabled !== false);
    return rec ?? null;
  }

  _reevaluateRenderer() {
    const s = this._source() || {};
    const want = !!s.enabled && s.desktopEnabled !== false && this._activePetRecord() != null;
    if (want) this._spawnRenderer();
    else this._killRenderer();
  }

  _spawnRenderer() {
    if (this._child) return;
    if (this._respawning) return;
    if (!existsSync(RENDERER_BIN)) {
      this.ctx.logger?.warn?.(`[petdex-market] renderer binary missing: ${RENDERER_BIN}`);
      return;
    }
    if (!this._webPort) return; // no server origin yet
    const child = spawn(RENDERER_BIN, ['--server', `http://127.0.0.1:${this._webPort}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this._child = child;
    child.stdout?.on('data', (d) => this.ctx.logger?.info?.(`[petdex-renderer] ${String(d).trimEnd()}`));
    child.stderr?.on('data', (d) => this.ctx.logger?.warn?.(`[petdex-renderer] ${String(d).trimEnd()}`));
    child.on('exit', (code) => {
      if (this._child === child) this._child = null;
      this.ctx.logger?.info?.(`[petdex-market] renderer exited (code ${code})`);
      // Crash watchdog: respawn once if desktop rendering should still be on
      // (e.g. renderer binary updated / transient failure).
      const s = this._source() || {};
      const want = !!s.enabled && s.desktopEnabled !== false && this._activePetRecord() != null;
      if (want && !this._respawning) {
        this._respawning = true;
        setTimeout(() => {
          this._respawning = false;
          this._spawnRenderer();
        }, 2000);
      }
    });
    this.ctx.logger?.info?.(`[petdex-market] renderer spawned (pid ${child.pid})`);
  }

  _killRenderer() {
    if (!this._child) return;
    try { this._child.kill(); } catch { /* already gone */ }
    this._child = null;
  }

  _manifestTtl() {
    const v = Number(this._source()?.manifestTtlMs);
    return Number.isFinite(v) && v > 0 ? v : 300000;
  }

  _metaTtl() {
    const v = Number(this._source()?.metaTtlMs);
    return Number.isFinite(v) && v > 0 ? v : 1800000;
  }

  _spriteTtl() {
    const v = Number(this._source()?.spriteTtlMs);
    return Number.isFinite(v) && v > 0 ? v : 600000;
  }

  _pageSize() {
    const v = Number(this._source()?.pageSize);
    return Number.isFinite(v) && v > 0 ? v : 48;
  }

  /** Sanitize a pet record into a plain JSON object (settings.update rejects
   *  class instances with a non-trivial prototype). */
  _toPlainPet(rec) {
    const o = { ...rec };
    return {
      id: String(o.id),
      slug: String(o.slug),
      displayName: String(o.displayName),
      kind: String(o.kind || ''),
      submittedBy: o.submittedBy ?? null,
      spritesheetUrl: String(o.spritesheetUrl || ''),
      petJsonUrl: String(o.petJsonUrl || ''),
      enabled: o.enabled !== false,
      buddyName: o.buddyName || undefined,
      installedAt: String(o.installedAt || new Date().toISOString()),
    };
  }

  async _persist(patch) {
    const settings = this.ctx.get('settings');
    if (!settings) return;
    const current = this._source() || {};
    const next = {
      enabled: !!current.enabled,
      pets: (current.pets ?? []).map((p) => this._toPlainPet(p)),
      activePetId: current.activePetId ?? '',
      pageSize: Number(current.pageSize) || 48,
      manifestTtlMs: Number(current.manifestTtlMs) || 300000,
      metaTtlMs: Number(current.metaTtlMs) || 1800000,
      spriteTtlMs: Number(current.spriteTtlMs) || 600000,
      desktopEnabled: current.desktopEnabled !== false,
      petScale: Number(current.petScale) || 1,
      petLiveliness:
        typeof current.petLiveliness === 'number' ? current.petLiveliness : DEFAULT_LIVELINESS,
      bubbleEnabled: current.bubbleEnabled !== false,
      ...patch,
    };
    // Any pets passed in the patch must also be sanitized to plain JSON.
    if (patch && Array.isArray(patch.pets)) {
      next.pets = patch.pets.map((p) => this._toPlainPet(p));
    }
    await settings.update(SETTINGS_NS, next);
  }

  _petsView() {
    return this._pets.map((p) => {
      const rec = new PetdexInstalledPet();
      Object.assign(rec, p);
      return {
        id: rec.id,
        slug: rec.slug,
        displayName: rec.displayName,
        buddyName: rec.buddyName || undefined,
        enabled: rec.enabled !== false,
        spriteSrc: installedSpriteSrc(rec.id),
        frameWidth: rec.frameWidth,
        frameHeight: rec.frameHeight,
      };
    });
  }

  // ── HTTP API for the Settings tab + desktop renderer ──

  async httpHandler(req, res) {
    const send = (code, obj) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(obj));
    };
    const sendRaw = (code, buf, contentType) => {
      res.writeHead(code, { 'content-type': contentType, 'cache-control': 'public, max-age=60' });
      res.end(Buffer.from(buf));
    };
    const readBody = () => new Promise((resolve) => {
      let data = '';
      req.on('data', (c) => { data += c; });
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    });
    try {
      const url = new URL(req.url, 'http://x');
      const path = url.pathname.replace(/^\/petdex-market\/?/, '');

      // Market list (paginated + filtered + sorted).
      if (req.method === 'GET' && path === 'market') {
        const q = (url.searchParams.get('q') || '').toLowerCase().trim();
        const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
        const limit = Math.max(1, Number(url.searchParams.get('limit')) || this._pageSize());
        const CATALOG_SORTS = ['curated', 'newest', 'most-liked', 'most-installed'];
        const sort = CATALOG_SORTS.includes(url.searchParams.get('sort'))
          ? url.searchParams.get('sort')
          : 'most-liked';

        // Stats-based sorts need the full search-API index; alphabetical only
        // needs the manifest. While the index builds (first request), fall
        // back to the manifest order and flag sortReady:false.
        let base;
        let sortReady = false;
        if (sort === 'alphabetical') {
          const manifest = await fetchPetdexManifest(false, req.signal);
          base = manifest.pets.map((p) => ({
            slug: p.slug,
            displayName: p.displayName,
            kind: p.kind,
            submittedBy: p.submittedBy,
            spritesheetUrl: p.spritesheetUrl,
            petJsonUrl: p.petJsonUrl,
            zipUrl: p.zipUrl,
            featured: false,
            approvedAt: null,
            dexNumber: null,
            likeCount: 0,
            installCount: 0,
          }));
          base.sort((a, b) => a.displayName.localeCompare(b.displayName));
          sortReady = true;
        } else if (hasPetdexCatalog()) {
          const catalog = await fetchPetdexCatalog(CATALOG_TTL_MS, req.signal);
          base = sortCatalogPets(catalog, sort).pets;
          sortReady = true;
        } else {
          const manifest = await fetchPetdexManifest(false, req.signal);
          base = manifest.pets.map((p) => ({
            slug: p.slug,
            displayName: p.displayName,
            kind: p.kind,
            submittedBy: p.submittedBy,
            spritesheetUrl: p.spritesheetUrl,
            petJsonUrl: p.petJsonUrl,
            zipUrl: p.zipUrl,
            featured: false,
            approvedAt: null,
            dexNumber: null,
            likeCount: 0,
            installCount: 0,
          }));
          sortReady = false;
          // Kick off the index build in the background (independent of this
          // request's abort signal); the next poll gets the sorted list.
          void fetchPetdexCatalog(CATALOG_TTL_MS, undefined).catch(() => {});
        }
        const filtered = q
          ? base.filter((p) =>
              (p.displayName || '').toLowerCase().includes(q) ||
              (p.kind || '').toLowerCase().includes(q) ||
              (p.submittedBy || '').toLowerCase().includes(q))
          : base;
        const page = filtered.slice(offset, offset + limit);
        return send(200, {
          total: base.length,
          filtered: filtered.length,
          sort,
          sortReady,
          pets: page,
        });
      }

      // Installed pets collection + desktop prefs.
      if (req.method === 'GET' && path === 'pets') {
        const s = this._source() || {};
        return send(200, {
          pets: this._petsView(),
          activePetId: this._activePetId || null,
          desktopEnabled: s.desktopEnabled !== false,
          petScale: typeof s.petScale === 'number' ? s.petScale : 1,
          petLiveliness:
            typeof s.petLiveliness === 'number'
              ? Math.min(1, Math.max(0, s.petLiveliness))
              : DEFAULT_LIVELINESS,
          bubbleEnabled: s.bubbleEnabled !== false,
        });
      }

      // Install a pet. Single active companion: the new pet becomes the active
      // one and every other pet is disabled.
      if (req.method === 'POST' && path === 'pets') {
        const body = await readBody();
        const slug = String(body.slug || '').trim();
        if (!slug) return send(400, { error: 'slug required' });
        const pet = await findManifestPet(slug, req.signal);
        if (!pet) return send(404, { error: `Pet "${slug}" not found in petdex.dev manifest` });
        if (this._pets.some((p) => p.slug === slug)) return send(409, { error: 'already installed' });
        const rec = new PetdexInstalledPet();
        rec.id = `pet_${crypto.randomBytes(6).toString('hex')}`;
        rec.slug = pet.slug;
        rec.displayName = pet.displayName;
        rec.kind = pet.kind;
        rec.submittedBy = pet.submittedBy;
        rec.spritesheetUrl = pet.spritesheetUrl;
        rec.petJsonUrl = pet.petJsonUrl;
        rec.enabled = true;
        rec.installedAt = new Date().toISOString();
        const next = this._pets.map((p) => ({ ...p, enabled: false }));
        next.push(rec);
        await this._persist({ pets: next, activePetId: rec.id });
        return send(200, { ok: true, pet: this._toPlainPet(rec) });
      }

      // Patch an installed pet (enabled / buddyName). `enabled` enforces the
      // single-active rule: enabling disables every other pet and makes this
      // one active; disabling clears activePetId when it was active.
      if (req.method === 'PATCH' && path.startsWith('pets/')) {
        const id = decodeURIComponent(path.slice('pets/'.length));
        const body = await readBody();
        const idx = this._pets.findIndex((p) => p.id === id);
        if (idx < 0) return send(404, { error: 'pet not found' });
        const pets = this._pets.map((p) => ({ ...p }));
        const rec = pets[idx];
        const patch = {};
        if (typeof body.enabled === 'boolean') {
          if (body.enabled) {
            for (const p of pets) p.enabled = p.id === id;
            patch.activePetId = id;
          } else {
            rec.enabled = false;
            if (this._activePetId === id) patch.activePetId = '';
          }
        }
        if (typeof body.buddyName === 'string') {
          rec.buddyName = body.buddyName || undefined;
        }
        patch.pets = pets;
        await this._persist(patch);
        return send(200, { ok: true, pet: this._toPlainPet(rec) });
      }

      // Delete an installed pet. If the removed pet was active, the next
      // enabled pet (if any) takes over.
      if (req.method === 'DELETE' && path.startsWith('pets/')) {
        const id = decodeURIComponent(path.slice('pets/'.length));
        const removed = this._pets.find((p) => p.id === id);
        if (!removed) return send(404, { error: 'pet not found' });
        const next = this._pets.filter((p) => p.id !== id);
        const patch = { pets: next };
        if (this._activePetId === id) {
          const candidate = next.find((p) => p.enabled);
          patch.activePetId = candidate?.id ?? '';
        }
        await this._persist(patch);
        return send(200, { ok: true });
      }

      // Desktop rendering prefs.
      if (path === 'desktop' && req.method === 'POST') {
        const body = await readBody();
        const { enabled, scale, liveliness, bubbleEnabled } = body;
        if (
          typeof enabled !== 'boolean' &&
          typeof scale !== 'number' &&
          typeof liveliness !== 'number' &&
          typeof bubbleEnabled !== 'boolean'
        ) {
          return send(400, {
            error: 'enabled (boolean), scale (number), liveliness (number), or bubbleEnabled (boolean) is required',
          });
        }
        const patch = {};
        if (typeof enabled === 'boolean') patch.desktopEnabled = enabled;
        if (typeof scale === 'number' && Number.isFinite(scale)) {
          patch.petScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
        }
        if (typeof liveliness === 'number' && Number.isFinite(liveliness)) {
          patch.petLiveliness = Math.min(1, Math.max(0, liveliness));
        }
        if (typeof bubbleEnabled === 'boolean') patch.bubbleEnabled = bubbleEnabled;
        await this._persist(patch);
        const s = this._source() || {};
        return send(200, {
          desktopEnabled: s.desktopEnabled !== false,
          petScale: typeof s.petScale === 'number' ? s.petScale : 1,
          petLiveliness:
            typeof s.petLiveliness === 'number'
              ? Math.min(1, Math.max(0, s.petLiveliness))
              : DEFAULT_LIVELINESS,
          bubbleEnabled: s.bubbleEnabled !== false,
        });
      }

      // Desktop config for the native renderer (absolute sprite URL + real
      // frame geometry + prefs + latest agent-activity state).
      if (path === 'desktop' && req.method === 'GET') {
        const s = this._source() || {};
        const rec = this._activePetRecord();
        let active = null;
        if (rec && this._webPort) {
          const meta = await fetchPetMeta(rec.petJsonUrl, this._metaTtl(), req.signal);
          active = {
            id: rec.id,
            displayName: rec.buddyName || rec.displayName,
            spriteSrc: `http://127.0.0.1:${this._webPort}${installedSpriteSrc(rec.id)}`,
            frameWidth: meta.frameWidth,
            frameHeight: meta.frameHeight,
            cols: meta.cols,
            rows: meta.rows,
          };
        }
        // While any turn is in flight the pet keeps running (fresh timestamp
        // each poll so the renderer's run override never lapses mid-turn);
        // otherwise report the last completed event (wave on turn end).
        const activity = this._activeTurns.size > 0
          ? { state: 'run', at: Date.now(), bubble: '' }
          : this._lastEvent;
        return send(200, {
          desktopEnabled: s.desktopEnabled !== false,
          activePet: active,
          petScale: typeof s.petScale === 'number' ? s.petScale : 1,
          petLiveliness:
            typeof s.petLiveliness === 'number'
              ? Math.min(1, Math.max(0, s.petLiveliness))
              : DEFAULT_LIVELINESS,
          bubbleEnabled: s.bubbleEnabled !== false,
          activity,
        });
      }

      // Proxy a market pet's spritesheet (same-origin, CORS-safe).
      if (req.method === 'GET' && path.startsWith('sprite/')) {
        const slug = decodeURIComponent(path.slice('sprite/'.length));
        try {
          const sprite = await fetchMarketSprite(slug, this._spriteTtl(), req.signal);
          return sendRaw(200, sprite.bytes, sprite.contentType);
        } catch (e) {
          return send(502, { error: e instanceof Error ? e.message : String(e) });
        }
      }

      // Proxy an installed pet's spritesheet (same-origin).
      if (req.method === 'GET' && path.startsWith('installed/') && path.endsWith('/sprite')) {
        const id = decodeURIComponent(path.slice('installed/'.length, path.length - '/sprite'.length));
        const rec = this._pets.find((p) => p.id === id);
        if (!rec) return send(404, { error: 'pet not found' });
        try {
          const sprite = await fetchMarketSprite(rec.slug, this._spriteTtl(), req.signal);
          return sendRaw(200, sprite.bytes, sprite.contentType);
        } catch (e) {
          return send(502, { error: e instanceof Error ? e.message : String(e) });
        }
      }

      // Metadata for a single market pet (geometry, for the preview canvas).
      if (req.method === 'GET' && path.startsWith('meta/')) {
        const slug = decodeURIComponent(path.slice('meta/'.length));
        const pet = await findManifestPet(slug, req.signal);
        if (!pet) return send(404, { error: 'pet not found' });
        const meta = await fetchPetMeta(pet.petJsonUrl, this._metaTtl(), req.signal);
        return send(200, {
          slug,
          frameWidth: meta.frameWidth,
          frameHeight: meta.frameHeight,
          cols: meta.cols,
          rows: meta.rows,
          fps: meta.fps,
          tags: meta.tags || [],
          vibes: meta.vibes || [],
          color: meta.color || null,
          era: meta.era || null,
          author: meta.author || pet.submittedBy,
        });
      }

      // Flush all in-memory caches (manifest / meta / proxied sprites).
      if (req.method === 'POST' && path === 'cache') {
        clearPetdexCaches();
        return send(200, { ok: true });
      }

      return send(404, { error: 'unknown endpoint' });
    } catch (err) {
      return send(500, { error: err instanceof Error ? err.message : String(err) });
    }
  }
}

export { name };
