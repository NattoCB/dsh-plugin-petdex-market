// @jasper/dsh-plugin-petdex-market — Settings UI tab (client)
//
// DSH Settings UI tab for the petdex marketplace: Market / Collected tab
// switcher, search + "show more" pagination, install / enable / rename /
// delete affordances, and a same-origin sprite-preview canvas. Registered
// into the DSH Settings sidebar via the `settings.section` slot. This file
// is the source; client/client.js is produced by esbuild.

import * as React from 'react';

/** Same-origin proxy URL for a market pet's spritesheet (CORS-safe). */
function marketSpriteSrc(slug: string): string {
  return `/petdex-market/sprite/${encodeURIComponent(slug)}`;
}
/** Same-origin proxy URL for an installed pet's sprite. */
function installedSpriteSrc(id: string): string {
  return `/petdex-market/installed/${encodeURIComponent(id)}/sprite`;
}

interface MarketPet {
  slug: string;
  displayName: string;
  kind: string;
  submittedBy: string | null;
  spritesheetUrl: string;
  petJsonUrl: string;
  zipUrl: string;
  featured?: boolean;
  approvedAt?: string | null;
  likeCount?: number;
  installCount?: number;
}
interface InstalledPetView {
  id: string;
  slug: string;
  displayName: string;
  buddyName?: string;
  enabled: boolean;
  spriteSrc: string;
  frameWidth?: number;
  frameHeight?: number;
}
interface PetsResponse {
  pets: InstalledPetView[];
  activePetId: string | null;
  desktopEnabled: boolean;
  petScale: number;
  petLiveliness: number;
  bubbleEnabled: boolean;
}
interface MarketResponse {
  total: number;
  filtered: number;
  sort: string;
  sortReady: boolean;
  pets: MarketPet[];
}

const PAGE_SIZE = 48;

export type PetdexSort = 'curated' | 'newest' | 'most-liked' | 'most-installed' | 'alphabetical';
export const DEFAULT_SORT: PetdexSort = 'most-liked';

/** In-memory cache of decoded sprite images, keyed by proxy URL. Any preview
 *  already loaded (installed or not) reuses the same Image instead of
 *  refetching, until the user clears the cache. */
const spriteCache = new Map<string, HTMLImageElement>();
export function clearSpriteCache(): void {
  spriteCache.clear();
}

/** Paint one 192×208 frame region of the sprite into the canvas. */
function paintFrame(c: HTMLCanvasElement, img: HTMLImageElement, fw: number, fh: number) {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, fw, fh, 0, 0, c.width, c.height);
}

/**
 * Draws the idle frame (row 0, col 0 of the 8×9 petdex spritesheet) of a pet's
 * spritesheet into a pixelated canvas. Load is deferred via IntersectionObserver
 * so dozens of large WebPs aren't fetched at once. The sprite is served
 * same-origin from our proxy, so no crossOrigin attribute is needed.
 */
function PetPreview({ src, size = 96, frameWidth, frameHeight }: {
  src: string;
  size?: number;
  frameWidth?: number;
  frameHeight?: number;
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  const fw = frameWidth && frameWidth > 0 ? frameWidth : 192;
  const fh = frameHeight && frameHeight > 0 ? frameHeight : 208;
  const h = Math.round((size * fh) / fw);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    const c = ref.current;
    if (!c) return;
    let img = spriteCache.get(src);
    if (!img) {
      img = new Image();
      spriteCache.set(src, img);
      img.src = src;
    }
    const paint = () => paintFrame(c, img!, fw, fh);
    if (img.complete && img.naturalWidth > 0) {
      paint();
      return;
    }
    img.addEventListener('load', paint, { once: true });
    img.addEventListener('error', () => { spriteCache.delete(src); }, { once: true });
  }, [src, visible, fw, fh]);

  return (
    <div ref={wrapRef} style={{ width: size, height: h }}>
      <canvas
        ref={ref}
        width={size}
        height={h}
        style={{ width: size, height: h, imageRendering: 'pixelated' }}
      />
    </div>
  );
}

export function PetdexSection(_props: Record<string, unknown>) {
  const [marketPets, setMarketPets] = React.useState<MarketPet[]>([]);
  const [marketTotal, setMarketTotal] = React.useState(0);
  const [marketFiltered, setMarketFiltered] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [offset, setOffset] = React.useState(0);
  const [sort, setSort] = React.useState<PetdexSort>(DEFAULT_SORT);
  const [marketSortReady, setMarketSortReady] = React.useState(true);
  const [marketLoading, setMarketLoading] = React.useState(false);
  const [marketError, setMarketError] = React.useState<string | null>(null);

  const [installed, setInstalled] = React.useState<InstalledPetView[]>([]);
  const [activePetId, setActivePetId] = React.useState<string | null>(null);
  const [desktopEnabled, setDesktopEnabled] = React.useState(true);
  const [petScale, setPetScale] = React.useState(1);
  const [petLiveliness, setPetLiveliness] = React.useState(0.6);
  const [bubbleEnabled, setBubbleEnabled] = React.useState(true);

  const [tab, setTab] = React.useState<'market' | 'collected'>('market');
  const [clearingCache, setClearingCache] = React.useState(false);
  const [cacheMsg, setCacheMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [installingSlug, setInstallingSlug] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  const loadInstalled = React.useCallback(async () => {
    try {
      const res = await fetch('/petdex-market/pets');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load pets');
        return;
      }
      const data = (await res.json()) as PetsResponse;
      setInstalled(data.pets ?? []);
      setActivePetId(data.activePetId ?? null);
      setDesktopEnabled(data.desktopEnabled !== false);
      setPetScale(typeof data.petScale === 'number' ? data.petScale : 1);
      setPetLiveliness(typeof data.petLiveliness === 'number' ? data.petLiveliness : 0.6);
      setBubbleEnabled(data.bubbleEnabled !== false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pets');
    }
  }, []);

  /** Persist one desktop-pet preference (POST /petdex-market/desktop). */
  const postDesktopSetting = React.useCallback(async (patch: Record<string, unknown>) => {
    try {
      const res = await fetch('/petdex-market/desktop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to update desktop setting');
        return false;
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update desktop setting');
      return false;
    }
  }, []);

  const loadMarket = React.useCallback(async (q: string, off: number, replace: boolean, s: PetdexSort = sort) => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const params = new URLSearchParams({ q, offset: String(off), limit: String(PAGE_SIZE), sort: s });
      const res = await fetch(`/petdex-market/market?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMarketError(data.error || 'Failed to load petdex market');
        return;
      }
      const data = (await res.json()) as MarketResponse;
      setMarketTotal(data.total);
      setMarketFiltered(data.filtered);
      setMarketSortReady(data.sortReady !== false);
      setMarketPets((prev) => (replace ? data.pets : [...prev, ...data.pets]));
    } catch (e) {
      setMarketError(e instanceof Error ? e.message : 'Failed to load petdex market');
    } finally {
      setMarketLoading(false);
    }
  }, [sort]);

  React.useEffect(() => {
    void loadInstalled().finally(() => setLoading(false));
    void loadMarket('', 0, true);
    // Mount-only: the initial sort is DEFAULT_SORT by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While the popularity index builds server-side, poll until the sort is
  // actually applied (server returns sortReady:false in the meantime).
  React.useEffect(() => {
    if (tab !== 'market' || marketSortReady || sort === 'alphabetical') return;
    const id = window.setInterval(() => { void loadMarket(query, offset, true); }, 5000);
    return () => window.clearInterval(id);
  }, [tab, marketSortReady, sort, query, offset, loadMarket]);

  const onSearch = (value: string) => {
    setQuery(value);
    setOffset(0);
    void loadMarket(value, 0, true);
  };
  const onSortChange = (value: string) => {
    const s = (value as PetdexSort);
    setSort(s);
    setOffset(0);
    void loadMarket(query, 0, true, s);
  };
  const onShowMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    void loadMarket(query, next, false);
  };

  const installedBySlug = new Map<string, InstalledPetView>();
  for (const p of installed) installedBySlug.set(p.slug, p);

  const handleInstall = React.useCallback(async (slug: string) => {
    setInstallingSlug(slug);
    try {
      const res = await fetch('/petdex-market/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Install failed');
        return;
      }
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Install failed');
    } finally {
      setInstallingSlug(null);
    }
  }, [loadInstalled]);

  const handleToggle = React.useCallback(async (pet: InstalledPetView, enabled: boolean) => {
    setBusyId(pet.id);
    try {
      const res = await fetch(`/petdex-market/pets/${encodeURIComponent(pet.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Update failed');
        return;
      }
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }, [loadInstalled]);

  const handleDelete = React.useCallback(async (pet: InstalledPetView) => {
    if (!window.confirm('Delete this pet? This only removes it from your saved collection.')) return;
    setBusyId(pet.id);
    try {
      const res = await fetch(`/petdex-market/pets/${encodeURIComponent(pet.id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Delete failed');
        return;
      }
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }, [loadInstalled]);

  const handleRename = React.useCallback(async (pet: InstalledPetView) => {
    const name = renameValue.trim();
    if (!name) return;
    setBusyId(pet.id);
    try {
      const res = await fetch(`/petdex-market/pets/${encodeURIComponent(pet.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buddyName: name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Rename failed');
        return;
      }
      setRenamingId(null);
      setRenameValue('');
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rename failed');
    } finally {
      setBusyId(null);
    }
  }, [loadInstalled, renameValue]);

  const handleClearCache = React.useCallback(async () => {
    setClearingCache(true);
    setCacheMsg(null);
    try {
      const res = await fetch('/petdex-market/cache', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCacheMsg(data.error || 'Failed to clear cache');
      } else {
        setCacheMsg('Cache cleared. Previews will refetch.');
        clearSpriteCache();
        await loadInstalled();
      }
    } catch (e) {
      setCacheMsg(e instanceof Error ? e.message : 'Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  }, [loadInstalled]);

  const t = (k: string) => PETDEX_COPY[k] ?? k;

  return (
    <div className="pxm_section">
      <div>
        <h2 className="pxm_title">{t('title')}</h2>
        <p className="pxm_desc">{t('desc')}</p>
      </div>

      {error && <div className="pxm_err">Error: {error}</div>}

      {/* Desktop rendering toggle. */}
      <div className="pxm_setrow">
        <div className="pxm_setlabel">
          <div className="pxm_setname">{t('desktop')}</div>
          <p className="pxm_setdesc">{t('desktopDesc')}</p>
        </div>
        <input
          type="checkbox"
          className="pxm_check"
          checked={desktopEnabled}
          disabled={loading}
          onChange={(e) => {
            const v = e.target.checked;
            setDesktopEnabled(v);
            void postDesktopSetting({ enabled: v });
          }}
        />
      </div>

      {/* Pet render size — range 40%..250%. */}
      <div className="pxm_setrow">
        <div className="pxm_setlabel">
          <div className="pxm_setname">{t('petSize')}</div>
          <p className="pxm_setdesc">{t('petSizeDesc')}</p>
        </div>
        <div className="pxm_range">
          <div className="pxm_rangemarks">
            <span>{t('petSizeSmall')}</span>
            <span className="pxm_rangeval">{t('petSizeValue').replace('{{value}}', String(Math.round(petScale * 100)))}</span>
            <span>{t('petSizeLarge')}</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={2.5}
            step={0.1}
            value={petScale}
            disabled={loading}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPetScale(v);
              void postDesktopSetting({ scale: v });
            }}
          />
        </div>
      </div>

      {/* Liveliness — how active/restless the pet is (0 = calm … 1 = lively). */}
      <div className="pxm_setrow">
        <div className="pxm_setlabel">
          <div className="pxm_setname">{t('petLiveliness')}</div>
          <p className="pxm_setdesc">{t('petLivelinessDesc')}</p>
        </div>
        <div className="pxm_range">
          <div className="pxm_rangemarks">
            <span>{t('petLivelinessCalm')}</span>
            <span className="pxm_rangeval">{t('petLivelinessValue').replace('{{value}}', String(Math.round(petLiveliness * 100)))}</span>
            <span>{t('petLivelinessLively')}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={petLiveliness}
            disabled={loading}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPetLiveliness(v);
              void postDesktopSetting({ liveliness: v });
            }}
          />
        </div>
      </div>

      {/* Speech bubble opt-out. */}
      <div className="pxm_setrow">
        <div className="pxm_setlabel">
          <div className="pxm_setname">{t('bubble')}</div>
          <p className="pxm_setdesc">{t('bubbleDesc')}</p>
        </div>
        <input
          type="checkbox"
          className="pxm_check"
          checked={bubbleEnabled}
          disabled={loading}
          onChange={(e) => {
            const v = e.target.checked;
            setBubbleEnabled(v);
            void postDesktopSetting({ bubbleEnabled: v });
          }}
        />
      </div>

      <div className="pxm_tabs">
        <button
          type="button"
          onClick={() => setTab('market')}
          className={tab === 'market' ? 'pxm_tab pxm_tab_on' : 'pxm_tab'}
        >
          {t('tabMarket')}
        </button>
        <button
          type="button"
          onClick={() => setTab('collected')}
          className={tab === 'collected' ? 'pxm_tab pxm_tab_on' : 'pxm_tab'}
        >
          {t('tabCollected')}
        </button>
        <div className="pxm_tabspacer">
          <button type="button" className="pxm_btn pxm_btn_ghost" onClick={handleClearCache} disabled={clearingCache}>
            {clearingCache ? t('clearingCache') : t('clearCache')}
          </button>
        </div>
      </div>
      {cacheMsg && <div className="pxm_cachemsg">{cacheMsg}</div>}

      {tab === 'collected' && (
        <div className="pxm_space">
          <h3 className="pxm_h3">{t('collected')}</h3>
          {installed.length === 0 ? (
            <p className="pxm_muted">{t('empty')}</p>
          ) : (
            <div className="pxm_grid">
              {installed.map((inst) => (
                <InstalledPetCard
                  key={inst.id}
                  inst={inst}
                  isActive={inst.id === activePetId}
                  busy={busyId === inst.id}
                  renaming={renamingId === inst.id}
                  renameValue={renameValue}
                  onRenameChange={setRenameValue}
                  onToggle={(enabled) => handleToggle(inst, enabled)}
                  onDelete={() => handleDelete(inst)}
                  onStartRename={() => { setRenamingId(inst.id); setRenameValue(inst.buddyName || inst.displayName || ''); }}
                  onCommitRename={() => handleRename(inst)}
                  onCancelRename={() => { setRenamingId(null); setRenameValue(''); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'market' && (
        <div className="pxm_space">
          <div className="pxm_markethead">
            <h3 className="pxm_h3">{t('market')}</h3>
            <div className="pxm_markettools">
              <select
                className="pxm_sort"
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                aria-label={t('sortLabel')}
              >
                <option value="most-liked">{t('sortMostLiked')}</option>
                <option value="curated">{t('sortCurated')}</option>
                <option value="newest">{t('sortNewest')}</option>
                <option value="most-installed">{t('sortMostInstalled')}</option>
                <option value="alphabetical">{t('sortAlphabetical')}</option>
              </select>
              <input
                type="search"
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={t('search')}
                className="pxm_search"
              />
            </div>
          </div>
          <div className="pxm_muted">
            {t('totalCount').replace('{{count}}', String(marketTotal))}
          </div>
          {!marketSortReady && sort !== 'alphabetical' && (
            <div className="pxm_cachemsg">{t('indexBuilding')}</div>
          )}

          {marketError && <div className="pxm_err">Error: {marketError}</div>}

          {marketLoading && marketPets.length === 0 ? (
            <div className="pxm_loading">{t('loading')}</div>
          ) : (
            <div className="pxm_grid">
              {marketPets.map((pet) => {
                const inst = installedBySlug.get(pet.slug);
                const isActive = !!inst && inst.id === activePetId;
                return (
                  <PetdexCard
                    key={pet.slug}
                    pet={pet}
                    installed={inst}
                    isActive={isActive}
                    installing={installingSlug === pet.slug}
                    busy={!!inst && busyId === inst.id}
                    renaming={renamingId === inst?.id}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onInstall={() => handleInstall(pet.slug)}
                    onToggle={(enabled) => inst && handleToggle(inst, enabled)}
                    onDelete={() => inst && handleDelete(inst)}
                    onStartRename={() => { setRenamingId(inst?.id ?? null); setRenameValue(inst?.buddyName || inst?.displayName || ''); }}
                    onCommitRename={() => inst && handleRename(inst)}
                    onCancelRename={() => { setRenamingId(null); setRenameValue(''); }}
                  />
                );
              })}
            </div>
          )}

          {!marketLoading && marketPets.length < marketFiltered && (
            <div className="pxm_showmore">
              <button type="button" className="pxm_btn pxm_btn_outline" onClick={onShowMore} disabled={marketLoading}>
                {t('showMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PetdexCardProps {
  pet: MarketPet;
  installed?: InstalledPetView;
  isActive: boolean;
  installing: boolean;
  busy: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onInstall: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
}

function PetdexCard(props: PetdexCardProps) {
  const { pet, installed, isActive, installing, busy, renaming, renameValue, onRenameChange, onInstall, onToggle, onDelete, onStartRename, onCommitRename, onCancelRename } = props;
  const t = (k: string) => PETDEX_COPY[k] ?? k;
  const label = pet.displayName;

  return (
    <div className={isActive ? 'pxm_card pxm_card_active' : 'pxm_card'}>
      <div className="pxm_cardmedia">
        <PetPreview src={marketSpriteSrc(pet.slug)} size={88} />
        {installed && <span className="pxm_badge pxm_badge_ok">{t('installed')}</span>}
        {isActive && <span className="pxm_badge pxm_badge_active">{t('active')}</span>}
      </div>

      <div className="pxm_name" title={label}>{label}</div>
      <div className="pxm_sub">
        {pet.submittedBy ? t('by').replace('{{author}}', pet.submittedBy) : pet.kind}
      </div>

      {installed ? (
        <div className="pxm_cardactions">
          {renaming ? (
            <div className="pxm_rename">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                placeholder={t('renamePlaceholder')}
                className="pxm_input"
              />
              <button className="pxm_btn pxm_btn_outline" disabled={busy} onClick={onCommitRename}>{t('install')}</button>
              <button className="pxm_btn pxm_btn_ghost" disabled={busy} onClick={onCancelRename}>✕</button>
            </div>
          ) : (
            <>
              <div className="pxm_toggle">
                <input
                  type="checkbox"
                  checked={installed.enabled}
                  disabled={busy}
                  onChange={(e) => onToggle(e.target.checked)}
                />
                <span className="pxm_muted">{installed.enabled ? t('enabled') : t('disabled')}</span>
              </div>
              <div className="pxm_cardbtns">
                <button className="pxm_btn pxm_btn_outline" disabled={busy} onClick={onStartRename}>{t('rename')}</button>
                <button className="pxm_btn pxm_btn_danger" disabled={busy} onClick={onDelete}>{t('delete')}</button>
              </div>
              {isActive && <p className="pxm_hint">{t('activeHint')}</p>}
            </>
          )}
        </div>
      ) : (
        <button className="pxm_btn pxm_btn_primary" disabled={installing} onClick={onInstall}>
          {installing ? t('installing') : t('install')}
        </button>
      )}
    </div>
  );
}

interface InstalledPetCardProps {
  inst: InstalledPetView;
  isActive: boolean;
  busy: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
}

function InstalledPetCard(props: InstalledPetCardProps) {
  const { inst, isActive, busy, renaming, renameValue, onRenameChange, onToggle, onDelete, onStartRename, onCommitRename, onCancelRename } = props;
  const t = (k: string) => PETDEX_COPY[k] ?? k;
  const label = inst.buddyName || inst.displayName;

  return (
    <div className={isActive ? 'pxm_card pxm_card_active' : 'pxm_card'}>
      <div className="pxm_cardmedia">
        <PetPreview src={installedSpriteSrc(inst.id)} size={88} frameWidth={inst.frameWidth} frameHeight={inst.frameHeight} />
        {isActive && <span className="pxm_badge pxm_badge_active">{t('active')}</span>}
      </div>

      <div className="pxm_name" title={label}>{label}</div>

      {renaming ? (
        <div className="pxm_rename">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            placeholder={t('renamePlaceholder')}
            className="pxm_input"
          />
          <button className="pxm_btn pxm_btn_outline" disabled={busy} onClick={onCommitRename}>{t('install')}</button>
          <button className="pxm_btn pxm_btn_ghost" disabled={busy} onClick={onCancelRename}>✕</button>
        </div>
      ) : (
        <>
          <div className="pxm_toggle">
            <input type="checkbox" checked={inst.enabled} disabled={busy} onChange={(e) => onToggle(e.target.checked)} />
            <span className="pxm_muted">{inst.enabled ? t('enabled') : t('disabled')}</span>
          </div>
          <div className="pxm_cardbtns">
            <button className="pxm_btn pxm_btn_outline" disabled={busy} onClick={onStartRename}>{t('rename')}</button>
            <button className="pxm_btn pxm_btn_danger" disabled={busy} onClick={onDelete}>{t('delete')}</button>
          </div>
          {isActive && <p className="pxm_hint">{t('activeHint')}</p>}
        </>
      )}
    </div>
  );
}

// Localized copy (English) for the petdex Settings tab.
const PETDEX_COPY: Record<string, string> = {
  title: 'Petdex Market',
  desc: 'Browse, install, and manage companion pets from the live petdex.dev catalog. Previews are streamed same-origin; only your saved collection is stored locally.',
  tabMarket: 'Market',
  tabCollected: 'Collected',
  clearCache: 'Clear cache',
  clearingCache: 'Clearing…',
  collected: 'Collected',
  empty: 'Nothing collected yet. Install a pet from the Market tab.',
  market: 'Market',
  search: 'Search pets…',
  sortLabel: 'Sort',
  sortMostLiked: 'Most liked',
  sortCurated: 'Curated',
  sortNewest: 'Newest',
  sortMostInstalled: 'Most installed',
  sortAlphabetical: 'Alphabetical',
  indexBuilding: 'Building the popularity index… sorting will apply automatically in a few seconds.',
  loading: 'Loading market…',
  showMore: 'Show more',
  totalCount: '{{count}} pets in the catalog',
  installed: 'Installed',
  active: 'Active',
  rename: 'Rename',
  delete: 'Delete',
  enabled: 'Enabled',
  disabled: 'Disabled',
  install: 'Install',
  installing: 'Installing…',
  renamePlaceholder: 'Pet name',
  activeHint: 'This is your active pet.',
  by: 'by {{author}}',
  desktop: 'Desktop pet',
  desktopDesc: 'Render the active pet as a floating window that walks across your screen. Only one pet can be active at a time.',
  petSize: 'Pet size',
  petSizeDesc: 'Render scale of the desktop pet (40% – 250%).',
  petSizeSmall: 'Small',
  petSizeLarge: 'Large',
  petSizeValue: '{{value}}%',
  petLiveliness: 'Liveliness',
  petLivelinessDesc: 'How active the pet is on your screen. High = wanders often; low = mostly sits still.',
  petLivelinessCalm: 'Calm',
  petLivelinessLively: 'Lively',
  petLivelinessValue: '{{value}}%',
  bubble: 'Speech bubble',
  bubbleDesc: 'Pop a speech bubble when a session completes a reply. The pet still animates when disabled.',
};

// ── Slot registration (matches weixin-bridge plugin shape) ──
const inject = ['slots'];
function apply(ctx: any) {
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'petdex',
        order: 80,
        label: () => 'Petdex',
        children: {},
      },
      PetdexSection,
    ),
  );
}

export { apply, inject };
