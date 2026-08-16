// @jasper/dsh-plugin-petdex-market — petdex.dev client lib
//
// petdex.dev client lib for the DSH marketplace: live manifest access,
// per-pet pet.json metadata normalization (8×9 / 192×208 default geometry),
// and a same-origin sprite proxy cache. "Install" here means persisting a
// metadata record in settings.yaml and serving its preview through the proxy.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export const PETDEX_MANIFEST_URL = 'https://petdex.dev/api/manifest';
export const PETDEX_SEARCH_URL = 'https://petdex.dev/api/pets/search';
export const PETDEX_ASSET_BASE = 'https://assets.petdex.dev';

/**
 * Canonical row order in a petdex.dev spritesheet (per petdex.dev
 * src/lib/pet-states.ts + packages/petdex-desktop-native/src/sprite.zig):
 * running-right / running-left are SEPARATE directional art rows — a client
 * must not mirror the sprite to face the pet, it picks the row for the
 * direction of travel.
 * @typedef {('idle'|'running-right'|'running-left'|'waving'|'jumping'|'failed'|'waiting'|'running'|'review')} PetdexActivityState
 */
export const PETDEX_STATE_ROWS = [
  'idle',
  'running-right',
  'running-left',
  'waving',
  'jumping',
  'failed',
  'waiting',
  'running',
  'review',
];

/** A single pet as listed in the petdex.dev manifest. */
export class PetdexManifestPet {
  /** @param {{
   *   slug:string, displayName:string, kind:string, submittedBy:(string|null),
   *   spritesheetUrl:string, petJsonUrl:string, zipUrl:string
   * }} p */
  constructor(p) {
    this.slug = p.slug;
    this.displayName = p.displayName;
    this.kind = p.kind;
    this.submittedBy = p.submittedBy ?? null;
    this.spritesheetUrl = p.spritesheetUrl;
    this.petJsonUrl = p.petJsonUrl;
    this.zipUrl = p.zipUrl;
  }
}

/** Per-state default frame counts (petdex.dev canonical). */
const DEFAULT_STATE_FRAMES = {
  idle: 6,
  'running-right': 8,
  'running-left': 8,
  waving: 4,
  jumping: 5,
  failed: 8,
  waiting: 6,
  running: 6,
  review: 6,
};

/** Normalized pet.json metadata. */
export class PetdexPetMeta {
  constructor() {
    this.frameWidth = 192;
    this.frameHeight = 208;
    this.cols = 8;
    this.rows = 9;
    this.fps = 6;
    this.loopMs = 1100;
    /** @type {{name:string,row:number,frames:number}[]} */
    this.states = PETDEX_STATE_ROWS.map((name, row) => ({
      name,
      row,
      frames: DEFAULT_STATE_FRAMES[name] ?? 6,
    }));
    this.tags = undefined;
    this.vibes = undefined;
    this.color = undefined;
    this.era = undefined;
    this.author = null;
  }
}

/** A pet record persisted in the user's settings (PetsResponse.pets entry). */
export class PetdexInstalledPet {
  constructor() {
    this.id = '';
    this.slug = '';
    this.displayName = '';
    this.kind = '';
    this.submittedBy = null;
    this.spritesheetUrl = '';
    this.petJsonUrl = '';
    this.enabled = true;
    this.buddyName = undefined;
    this.installedAt = new Date().toISOString();
    /** Live-fetched by the API layer (not persisted). */
    this.frameWidth = undefined;
    this.frameHeight = undefined;
  }
}

const DEFAULT_META = new PetdexPetMeta();

class CacheEntry {
  /** @param {any} data */
  constructor(data) {
    this.at = Date.now();
    this.data = data;
  }
}

// ── In-memory caches (flushable from the settings "clear cache" action) ──

let manifestCache = null;
const metaCache = new Map();
const marketSpriteCache = new Map();

/** Clear all in-memory caches. */
export function clearPetdexCaches() {
  manifestCache = null;
  metaCache.clear();
  marketSpriteCache.clear();
  catalogCache = null;
}

/** @param {string} slug */
export function getCachedMarketSprite(slug) {
  const c = marketSpriteCache.get(slug);
  if (c) return { bytes: c.bytes, contentType: c.contentType };
  return null;
}

/**
 * @param {string} slug
 * @param {Uint8Array} bytes
 * @param {string} contentType
 */
export function setCachedMarketSprite(slug, bytes, contentType) {
  marketSpriteCache.set(slug, { bytes, contentType });
}

async function httpGetJson(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`petdex.dev request failed (${res.status}) for ${url}`);
  return res.json();
}

async function httpGetBuffer(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`petdex.dev download failed (${res.status}) for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/** @param {string} [slug] */
export async function findManifestPet(slug, signal) {
  const manifest = await fetchPetdexManifest(false, signal);
  return manifest.pets.find((p) => p.slug === slug);
}

/**
 * Fetch the petdex.dev manifest (the /api/manifest endpoint 307-redirects to
 * the canonical JSON; fetch follows it automatically).
 * @param {boolean} [force]
 * @param {AbortSignal} [signal]
 */
export async function fetchPetdexManifest(force = false, signal) {
  if (!force && manifestCache && Date.now() - manifestCache.at < (fetchPetdexManifest.ttl ?? 300000)) {
    return manifestCache.data;
  }
  const raw = await httpGetJson(PETDEX_MANIFEST_URL, signal);
  // The live manifest also carries total + generatedAt; normalize to a list.
  const pets = (raw.pets || []).map((p) => new PetdexManifestPet(p));
  const manifest = {
    generatedAt: raw.generatedAt || new Date().toISOString(),
    total: typeof raw.total === 'number' ? raw.total : pets.length,
    pets,
  };
  manifestCache = new CacheEntry(manifest);
  return manifest;
}

/** Set the manifest TTL (ms) used by fetchPetdexManifest. */
export function setManifestTtl(ms) {
  fetchPetdexManifest.ttl = ms;
}

/**
 * Fetch + normalize a pet's pet.json metadata. Falls back to the standard
 * 8×9 / 192×208 / 6-frames geometry when the file is missing or malformed.
 * @param {string} petJsonUrl
 * @param {number} [metaTtlMs]
 * @param {AbortSignal} [signal]
 */
export async function fetchPetMeta(petJsonUrl, metaTtlMs = 1800000, signal) {
  const cached = metaCache.get(petJsonUrl);
  if (cached && Date.now() - cached.at < metaTtlMs) return cached.data;
  try {
    const raw = await httpGetJson(petJsonUrl, signal);
    const meta = normalizeMeta(raw);
    metaCache.set(petJsonUrl, new CacheEntry(meta));
    return meta;
  } catch {
    return DEFAULT_META;
  }
}

function asInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * @param {Record<string,unknown>} raw
 * @returns {PetdexPetMeta}
 */
function normalizeMeta(raw) {
  const meta = new PetdexPetMeta();
  const cols = asInt(raw.cols ?? raw.columns, 8);
  const rows = asInt(raw.rows, 9);
  meta.cols = cols;
  meta.rows = rows;
  meta.frameWidth = asInt(raw.frameWidth ?? raw.frame_width ?? raw.width, 192);
  meta.frameHeight = asInt(raw.frameHeight ?? raw.frame_height ?? raw.height, 208);
  meta.fps = asInt(raw.fps, 6);
  meta.loopMs = asInt(raw.loopMs ?? raw.loop_ms, 1100);

  /** @type {{name:string,row:number,frames:number}[]} */
  let states = [];
  const rawStates = raw.states;
  if (Array.isArray(rawStates)) {
    states = rawStates
      .map((s, i) => {
        const obj = (s ?? {});
        const name = obj.name || PETDEX_STATE_ROWS[i] || `state${i}`;
        const row = asInt(obj.row, i);
        const frames = asInt(obj.frames, 6);
        return { name, row, frames };
      })
      .slice(0, rows);
  }
  for (let r = states.length; r < rows; r++) {
    const name = PETDEX_STATE_ROWS[r] ?? `state${r}`;
    states.push({ name, row: r, frames: DEFAULT_STATE_FRAMES[name] ?? 6 });
  }
  meta.states = states;
  meta.tags = Array.isArray(raw.tags) ? raw.tags : undefined;
  meta.vibes = Array.isArray(raw.vibes) ? raw.vibes : undefined;
  meta.color = typeof raw.color === 'string' ? raw.color : undefined;
  meta.era = typeof raw.era === 'string' ? raw.era : undefined;
  meta.author = typeof raw.submittedBy === 'string' ? raw.submittedBy : null;
  return meta;
}

/** Map an activity state to its row index in the spritesheet. */
export function stateRowIndex(meta, state) {
  const found = meta.states.find((s) => s.name === state);
  if (found) return found.row;
  const idx = PETDEX_STATE_ROWS.indexOf(state);
  return idx >= 0 ? idx : 0;
}

/** Proxy a market pet's spritesheet (same-origin so the WebView can render it). */
export async function fetchMarketSprite(slug, ttlMs = 600000, signal) {
  const cached = getCachedMarketSprite(slug);
  if (cached) return cached;
  const pet = await findManifestPet(slug, signal);
  if (!pet) throw new Error(`Pet "${slug}" not found in petdex.dev manifest`);
  const buf = await httpGetBuffer(pet.spritesheetUrl, signal);
  const contentType = pet.spritesheetUrl.toLowerCase().endsWith('.png')
    ? 'image/png'
    : pet.spritesheetUrl.toLowerCase().endsWith('.gif')
      ? 'image/gif'
      : 'image/webp';
  const out = { bytes: new Uint8Array(buf), contentType };
  setCachedMarketSprite(slug, out.bytes, out.contentType);
  return out;
}

/** Resolve the same-origin proxy URL for a market pet's sprite. */
export function marketSpriteSrc(slug) {
  return `/petdex-market/sprite/${encodeURIComponent(slug)}`;
}

/** Resolve the installed-pet sprite URL (same-origin proxy keyed by pet id). */
export function installedSpriteSrc(id) {
  return `/petdex-market/installed/${encodeURIComponent(id)}/sprite`;
}

// ── Full catalog index (search API: metrics + timestamps, ~4.5k pets) ──

let catalogCache = null;
let catalogBuilding = null;

/** One page of the search API (limit is capped at 60 server-side). */
async function fetchSearchPage(cursor, signal) {
  const url = new URL(PETDEX_SEARCH_URL);
  url.searchParams.set('limit', '60');
  if (cursor != null) url.searchParams.set('cursor', String(cursor));
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`petdex.dev search failed (${res.status})`);
  const data = await res.json();
  return { pets: data.pets ?? [], total: typeof data.total === 'number' ? data.total : null, nextCursor: data.nextCursor };
}

/**
 * Build (or return) the full petdex catalog: every pet from the search API,
 * joined with the manifest for petJsonUrl, cached for `ttlMs`. The search API
 * pages at 60 pets per request, so the index takes ~76 requests; they are
 * fetched with bounded concurrency and the finished index is cached.
 * @param {number} [ttlMs]
 * @param {AbortSignal} [signal]
 */
export async function fetchPetdexCatalog(ttlMs = 900000, signal) {
  if (catalogCache && Date.now() - catalogCache.at < ttlMs) return catalogCache.data;
  if (catalogBuilding) return catalogBuilding;
  catalogBuilding = (async () => {
    const manifest = await fetchPetdexManifest(false, signal);
    const bySlug = new Map(manifest.pets.map((p) => [p.slug, p]));
    const first = await fetchSearchPage(0, signal);
    const total = first.total ?? first.pets.length;
    const pageCount = Math.max(1, Math.ceil(total / 60));
    const pages = [first];
    const CONCURRENCY = 8;
    for (let start = 1; start < pageCount; start += CONCURRENCY) {
      const window = [];
      for (let i = start; i < Math.min(pageCount, start + CONCURRENCY); i++) {
        window.push(fetchSearchPage(i * 60, signal));
      }
      const batch = await Promise.all(window);
      pages.push(...batch);
    }
    const pets = pages.flatMap((page) => page.pets).map((s) => {
      const mp = bySlug.get(s.slug);
      return {
        slug: String(s.slug),
        displayName: String(s.displayName ?? s.slug),
        kind: String(s.kind ?? ''),
        submittedBy:
          typeof s.submittedBy === 'string'
            ? s.submittedBy
            : s.submittedBy && typeof s.submittedBy.name === 'string'
              ? s.submittedBy.name
              : null,
        spritesheetUrl: String(s.spritesheetPath ?? mp?.spritesheetUrl ?? ''),
        petJsonUrl: String(mp?.petJsonUrl ?? ''),
        zipUrl: String(s.zipUrl ?? mp?.zipUrl ?? ''),
        featured: s.featured === true,
        approvedAt: typeof s.approvedAt === 'string' ? s.approvedAt : null,
        dexNumber: typeof s.dexNumber === 'number' ? s.dexNumber : null,
        likeCount: Number(s.metrics?.likeCount ?? 0),
        installCount: Number(s.metrics?.installCount ?? 0),
      };
    });
    const data = { total: pets.length, pets };
    catalogCache = new CacheEntry(data);
    return data;
  })();
  try {
    return await catalogBuilding;
  } finally {
    catalogBuilding = null;
  }
}

/** Whether the full catalog index is already built (fast-path check). */
export function hasPetdexCatalog() {
  return !!catalogCache;
}

/**
 * Sort catalog entries by one of the supported keys.
 * @param {{pets:any[], total:number}} catalog
 * @param {string} sort curated | newest | most-liked | most-installed | alphabetical
 */
export function sortCatalogPets(catalog, sort) {
  const pets = catalog.pets.slice();
  switch (sort) {
    case 'curated':
      pets.sort((a, b) =>
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.likeCount - a.likeCount || a.displayName.localeCompare(b.displayName));
      break;
    case 'newest':
      pets.sort((a, b) => (b.approvedAt ?? '').localeCompare(a.approvedAt ?? '') || (b.dexNumber ?? 0) - (a.dexNumber ?? 0));
      break;
    case 'most-liked':
      pets.sort((a, b) => b.likeCount - a.likeCount || a.displayName.localeCompare(b.displayName));
      break;
    case 'most-installed':
      pets.sort((a, b) => b.installCount - a.installCount || a.displayName.localeCompare(b.displayName));
      break;
    case 'alphabetical':
    default:
      pets.sort((a, b) => a.displayName.localeCompare(b.displayName));
      break;
  }
  return { ...catalog, pets };
}

export { fs, path };
