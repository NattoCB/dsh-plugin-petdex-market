window.__ModuleLoader__.load({
  id: "@jasper/dsh-plugin-petdex-market",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    let react_jsx_runtime = require("react/jsx-runtime");

    // ── Scoped CSS ──
    const css = "\n.pxm_section{width:100%;max-width:980px;display:flex;flex-direction:column;gap:20px;color:var(--dsw-alias-label-primary);font-family:inherit}\n.pxm_title{margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em}\n.pxm_desc{margin:4px 0 0;font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.5}\n.pxm_err{color:var(--dsw-alias-state-error-primary);font-size:13px;background:var(--dsw-alias-state-error-muted);padding:8px 12px;border-radius:8px}\n.pxm_muted{color:var(--dsw-alias-label-tertiary);font-size:12px}\n.pxm_tabs{display:flex;align-items:center;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l2)}\n.pxm_tab{background:none;border:none;cursor:pointer;padding:8px 12px;font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary);border-bottom:2px solid transparent;margin-bottom:-1px}\n.pxm_tab_on{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-state-business-primary)}\n.pxm_tabspacer{margin-left:auto}\n.pxm_cachemsg{font-size:12px;color:var(--dsw-alias-label-tertiary)}\n.pxm_space{display:flex;flex-direction:column;gap:14px}\n.pxm_h3{margin:0;font-size:15px;font-weight:600}\n.pxm_markethead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.pxm_markettools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.pxm_sort{max-width:180px;padding:6px 10px;font-size:13px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}\n.pxm_sort:focus{border-color:var(--dsw-alias-state-business-primary)}\n.pxm_search{width:260px;max-width:100%;padding:6px 12px;font-size:13px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}\n.pxm_search:focus{border-color:var(--dsw-alias-state-business-primary)}\n.pxm_loading{padding:48px 0;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px}\n.pxm_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}\n.pxm_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:14px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;min-width:0}\n.pxm_card_active{box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary)}\n.pxm_cardmedia{position:relative;display:flex;align-items:center;justify-content:center;width:96px;height:104px}\n.pxm_badge{position:absolute;border-radius:999px;padding:2px 6px;font-size:9px;font-weight:600}\n.pxm_badge_ok{top:-8px;right:-8px;background:var(--dsw-alias-state-success-muted);color:var(--dsw-alias-state-success-primary)}\n.pxm_badge_active{top:auto;right:auto;bottom:-8px;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--dsw-alias-state-business-primary);color:#fff;padding:2px 8px;font-size:9px;font-weight:600}\n.pxm_name{font-size:14px;font-weight:500;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pxm_sub{font-size:10px;color:var(--dsw-alias-label-tertiary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pxm_cardactions{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:4px;min-width:0}\n.pxm_toggle{display:flex;align-items:center;gap:6px}\n.pxm_cardbtns{display:flex;flex-wrap:wrap;gap:6px;width:100%;min-width:0}\n.pxm_hint{font-size:10px;color:var(--dsw-alias-label-tertiary);margin:0}\n.pxm_rename{display:flex;align-items:center;flex-wrap:wrap;gap:4px;width:100%;min-width:0}\n.pxm_input{flex:1;min-width:64px;padding:4px 8px;font-size:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}\n.pxm_input:focus{border-color:var(--dsw-alias-state-business-primary)}\n.pxm_btn{font:inherit;cursor:pointer;border-radius:6px;padding:4px 8px;font-size:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);min-width:0;white-space:nowrap}\n.pxm_btn:hover{background:var(--dsw-alias-interactive-bg-hover)}\n.pxm_btn:disabled{opacity:.55;cursor:default}\n.pxm_btn_primary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:#fff;width:100%;margin-top:4px}\n.pxm_btn_outline{border:1px solid var(--dsw-alias-border-l2);flex:1 1 auto}\n.pxm_btn_ghost{border-color:transparent;background:none;flex:0 0 auto}\n.pxm_btn_danger{color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-border-l2);flex:1 1 auto}\n.pxm_showmore{display:flex;justify-content:center;padding-top:8px}\n.pxm_setrow{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px}\n.pxm_setlabel{display:flex;flex-direction:column;gap:2px;min-width:0}\n.pxm_setname{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}\n.pxm_setdesc{font-size:12px;color:var(--dsw-alias-label-tertiary);margin:0;max-width:520px;line-height:1.45}\n.pxm_check{width:16px;height:16px;flex:0 0 auto;accent-color:var(--dsw-alias-state-business-primary);margin-top:2px}\n.pxm_range{display:flex;flex-direction:column;gap:4px;width:210px;flex:0 0 auto}\n.pxm_rangemarks{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-tertiary);gap:8px}\n.pxm_rangeval{font-weight:600;color:var(--dsw-alias-label-primary)}\n.pxm_range input[type=\"range\"]{width:100%;accent-color:var(--dsw-alias-state-business-primary)}\n";
    const tagId = "@jasper/dsh-plugin-petdex-market/settings.css";
    if (typeof document !== "undefined" && !document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]")) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "@jasper/dsh-plugin-petdex-market";
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    // ── Bundled module ──
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client_src.tsx
var client_src_exports = {};
__export(client_src_exports, {
  DEFAULT_SORT: () => DEFAULT_SORT,
  PetdexSection: () => PetdexSection,
  apply: () => apply,
  clearSpriteCache: () => clearSpriteCache,
  inject: () => inject
});
module.exports = __toCommonJS(client_src_exports);
var React = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
function marketSpriteSrc(slug) {
  return `/petdex-market/sprite/${encodeURIComponent(slug)}`;
}
function installedSpriteSrc(id) {
  return `/petdex-market/installed/${encodeURIComponent(id)}/sprite`;
}
var PAGE_SIZE = 48;
var DEFAULT_SORT = "most-liked";
var spriteCache = /* @__PURE__ */ new Map();
function clearSpriteCache() {
  spriteCache.clear();
}
function paintFrame(c, img, fw, fh) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, fw, fh, 0, 0, c.width, c.height);
}
function PetPreview({ src, size = 96, frameWidth, frameHeight }) {
  const ref = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  const fw = frameWidth && frameWidth > 0 ? frameWidth : 192;
  const fh = frameHeight && frameHeight > 0 ? frameHeight : 208;
  const h = Math.round(size * fh / fw);
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
      { rootMargin: "300px" }
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
    const paint = () => paintFrame(c, img, fw, fh);
    if (img.complete && img.naturalWidth > 0) {
      paint();
      return;
    }
    img.addEventListener("load", paint, { once: true });
    img.addEventListener("error", () => {
      spriteCache.delete(src);
    }, { once: true });
  }, [src, visible, fw, fh]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: wrapRef, style: { width: size, height: h }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "canvas",
    {
      ref,
      width: size,
      height: h,
      style: { width: size, height: h, imageRendering: "pixelated" }
    }
  ) });
}
function PetdexSection(_props) {
  const [marketPets, setMarketPets] = React.useState([]);
  const [marketTotal, setMarketTotal] = React.useState(0);
  const [marketFiltered, setMarketFiltered] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [offset, setOffset] = React.useState(0);
  const [sort, setSort] = React.useState(DEFAULT_SORT);
  const [marketSortReady, setMarketSortReady] = React.useState(true);
  const [marketLoading, setMarketLoading] = React.useState(false);
  const [marketError, setMarketError] = React.useState(null);
  const [installed, setInstalled] = React.useState([]);
  const [activePetId, setActivePetId] = React.useState(null);
  const [desktopEnabled, setDesktopEnabled] = React.useState(true);
  const [petScale, setPetScale] = React.useState(1);
  const [petLiveliness, setPetLiveliness] = React.useState(0.6);
  const [bubbleEnabled, setBubbleEnabled] = React.useState(true);
  const [tab, setTab] = React.useState("market");
  const [clearingCache, setClearingCache] = React.useState(false);
  const [cacheMsg, setCacheMsg] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [installingSlug, setInstallingSlug] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);
  const [renamingId, setRenamingId] = React.useState(null);
  const [renameValue, setRenameValue] = React.useState("");
  const loadInstalled = React.useCallback(async () => {
    try {
      const res = await fetch("/petdex-market/pets");
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        setError(data2.error || "Failed to load pets");
        return;
      }
      const data = await res.json();
      setInstalled(data.pets ?? []);
      setActivePetId(data.activePetId ?? null);
      setDesktopEnabled(data.desktopEnabled !== false);
      setPetScale(typeof data.petScale === "number" ? data.petScale : 1);
      setPetLiveliness(typeof data.petLiveliness === "number" ? data.petLiveliness : 0.6);
      setBubbleEnabled(data.bubbleEnabled !== false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pets");
    }
  }, []);
  const postDesktopSetting = React.useCallback(async (patch) => {
    try {
      const res = await fetch("/petdex-market/desktop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update desktop setting");
        return false;
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update desktop setting");
      return false;
    }
  }, []);
  const loadMarket = React.useCallback(async (q, off, replace, s = sort) => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const params = new URLSearchParams({ q, offset: String(off), limit: String(PAGE_SIZE), sort: s });
      const res = await fetch(`/petdex-market/market?${params.toString()}`);
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        setMarketError(data2.error || "Failed to load petdex market");
        return;
      }
      const data = await res.json();
      setMarketTotal(data.total);
      setMarketFiltered(data.filtered);
      setMarketSortReady(data.sortReady !== false);
      setMarketPets((prev) => replace ? data.pets : [...prev, ...data.pets]);
    } catch (e) {
      setMarketError(e instanceof Error ? e.message : "Failed to load petdex market");
    } finally {
      setMarketLoading(false);
    }
  }, [sort]);
  React.useEffect(() => {
    void loadInstalled().finally(() => setLoading(false));
    void loadMarket("", 0, true);
  }, []);
  React.useEffect(() => {
    if (tab !== "market" || marketSortReady || sort === "alphabetical") return;
    const id = window.setInterval(() => {
      void loadMarket(query, offset, true);
    }, 5e3);
    return () => window.clearInterval(id);
  }, [tab, marketSortReady, sort, query, offset, loadMarket]);
  const onSearch = (value) => {
    setQuery(value);
    setOffset(0);
    void loadMarket(value, 0, true);
  };
  const onSortChange = (value) => {
    const s = value;
    setSort(s);
    setOffset(0);
    void loadMarket(query, 0, true, s);
  };
  const onShowMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    void loadMarket(query, next, false);
  };
  const installedBySlug = /* @__PURE__ */ new Map();
  for (const p of installed) installedBySlug.set(p.slug, p);
  const handleInstall = React.useCallback(async (slug) => {
    setInstallingSlug(slug);
    try {
      const res = await fetch("/petdex-market/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Install failed");
        return;
      }
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Install failed");
    } finally {
      setInstallingSlug(null);
    }
  }, [loadInstalled]);
  const handleToggle = React.useCallback(async (pet, enabled) => {
    setBusyId(pet.id);
    try {
      const res = await fetch(`/petdex-market/pets/${encodeURIComponent(pet.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Update failed");
        return;
      }
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }, [loadInstalled]);
  const handleDelete = React.useCallback(async (pet) => {
    if (!window.confirm("Delete this pet? This only removes it from your saved collection.")) return;
    setBusyId(pet.id);
    try {
      const res = await fetch(`/petdex-market/pets/${encodeURIComponent(pet.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Delete failed");
        return;
      }
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }, [loadInstalled]);
  const handleRename = React.useCallback(async (pet) => {
    const name = renameValue.trim();
    if (!name) return;
    setBusyId(pet.id);
    try {
      const res = await fetch(`/petdex-market/pets/${encodeURIComponent(pet.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buddyName: name })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Rename failed");
        return;
      }
      setRenamingId(null);
      setRenameValue("");
      await loadInstalled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setBusyId(null);
    }
  }, [loadInstalled, renameValue]);
  const handleClearCache = React.useCallback(async () => {
    setClearingCache(true);
    setCacheMsg(null);
    try {
      const res = await fetch("/petdex-market/cache", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCacheMsg(data.error || "Failed to clear cache");
      } else {
        setCacheMsg("Cache cleared. Previews will refetch.");
        clearSpriteCache();
        await loadInstalled();
      }
    } catch (e) {
      setCacheMsg(e instanceof Error ? e.message : "Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  }, [loadInstalled]);
  const t = (k) => PETDEX_COPY[k] ?? k;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "pxm_title", children: t("title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_desc", children: t("desc") })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_err", children: [
      "Error: ",
      error
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setrow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setlabel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_setname", children: t("desktop") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_setdesc", children: t("desktopDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "checkbox",
          className: "pxm_check",
          checked: desktopEnabled,
          disabled: loading,
          onChange: (e) => {
            const v = e.target.checked;
            setDesktopEnabled(v);
            void postDesktopSetting({ enabled: v });
          }
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setrow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setlabel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_setname", children: t("petSize") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_setdesc", children: t("petSizeDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_range", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_rangemarks", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("petSizeSmall") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_rangeval", children: t("petSizeValue").replace("{{value}}", String(Math.round(petScale * 100))) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("petSizeLarge") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "range",
            min: 0.4,
            max: 2.5,
            step: 0.1,
            value: petScale,
            disabled: loading,
            onChange: (e) => {
              const v = Number(e.target.value);
              setPetScale(v);
              void postDesktopSetting({ scale: v });
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setrow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setlabel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_setname", children: t("petLiveliness") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_setdesc", children: t("petLivelinessDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_range", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_rangemarks", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("petLivelinessCalm") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_rangeval", children: t("petLivelinessValue").replace("{{value}}", String(Math.round(petLiveliness * 100))) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("petLivelinessLively") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "range",
            min: 0,
            max: 1,
            step: 0.05,
            value: petLiveliness,
            disabled: loading,
            onChange: (e) => {
              const v = Number(e.target.value);
              setPetLiveliness(v);
              void postDesktopSetting({ liveliness: v });
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setrow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_setlabel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_setname", children: t("bubble") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_setdesc", children: t("bubbleDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "checkbox",
          className: "pxm_check",
          checked: bubbleEnabled,
          disabled: loading,
          onChange: (e) => {
            const v = e.target.checked;
            setBubbleEnabled(v);
            void postDesktopSetting({ bubbleEnabled: v });
          }
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_tabs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          onClick: () => setTab("market"),
          className: tab === "market" ? "pxm_tab pxm_tab_on" : "pxm_tab",
          children: t("tabMarket")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          onClick: () => setTab("collected"),
          className: tab === "collected" ? "pxm_tab pxm_tab_on" : "pxm_tab",
          children: t("tabCollected")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_tabspacer", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "pxm_btn pxm_btn_ghost", onClick: handleClearCache, disabled: clearingCache, children: clearingCache ? t("clearingCache") : t("clearCache") }) })
    ] }),
    cacheMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_cachemsg", children: cacheMsg }),
    tab === "collected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_space", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "pxm_h3", children: t("collected") }),
      installed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_muted", children: t("empty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_grid", children: installed.map((inst) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        InstalledPetCard,
        {
          inst,
          isActive: inst.id === activePetId,
          busy: busyId === inst.id,
          renaming: renamingId === inst.id,
          renameValue,
          onRenameChange: setRenameValue,
          onToggle: (enabled) => handleToggle(inst, enabled),
          onDelete: () => handleDelete(inst),
          onStartRename: () => {
            setRenamingId(inst.id);
            setRenameValue(inst.buddyName || inst.displayName || "");
          },
          onCommitRename: () => handleRename(inst),
          onCancelRename: () => {
            setRenamingId(null);
            setRenameValue("");
          }
        },
        inst.id
      )) })
    ] }),
    tab === "market" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_space", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_markethead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "pxm_h3", children: t("market") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_markettools", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              className: "pxm_sort",
              value: sort,
              onChange: (e) => onSortChange(e.target.value),
              "aria-label": t("sortLabel"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "most-liked", children: t("sortMostLiked") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "curated", children: t("sortCurated") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "newest", children: t("sortNewest") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "most-installed", children: t("sortMostInstalled") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "alphabetical", children: t("sortAlphabetical") })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "search",
              value: query,
              onChange: (e) => onSearch(e.target.value),
              placeholder: t("search"),
              className: "pxm_search"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_muted", children: t("totalCount").replace("{{count}}", String(marketTotal)) }),
      !marketSortReady && sort !== "alphabetical" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_cachemsg", children: t("indexBuilding") }),
      marketError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_err", children: [
        "Error: ",
        marketError
      ] }),
      marketLoading && marketPets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_loading", children: t("loading") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_grid", children: marketPets.map((pet) => {
        const inst = installedBySlug.get(pet.slug);
        const isActive = !!inst && inst.id === activePetId;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          PetdexCard,
          {
            pet,
            installed: inst,
            isActive,
            installing: installingSlug === pet.slug,
            busy: !!inst && busyId === inst.id,
            renaming: renamingId === inst?.id,
            renameValue,
            onRenameChange: setRenameValue,
            onInstall: () => handleInstall(pet.slug),
            onToggle: (enabled) => inst && handleToggle(inst, enabled),
            onDelete: () => inst && handleDelete(inst),
            onStartRename: () => {
              setRenamingId(inst?.id ?? null);
              setRenameValue(inst?.buddyName || inst?.displayName || "");
            },
            onCommitRename: () => inst && handleRename(inst),
            onCancelRename: () => {
              setRenamingId(null);
              setRenameValue("");
            }
          },
          pet.slug
        );
      }) }),
      !marketLoading && marketPets.length < marketFiltered && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_showmore", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "pxm_btn pxm_btn_outline", onClick: onShowMore, disabled: marketLoading, children: t("showMore") }) })
    ] })
  ] });
}
function PetdexCard(props) {
  const { pet, installed, isActive, installing, busy, renaming, renameValue, onRenameChange, onInstall, onToggle, onDelete, onStartRename, onCommitRename, onCancelRename } = props;
  const t = (k) => PETDEX_COPY[k] ?? k;
  const label = pet.displayName;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: isActive ? "pxm_card pxm_card_active" : "pxm_card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_cardmedia", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetPreview, { src: marketSpriteSrc(pet.slug), size: 88 }),
      installed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_badge pxm_badge_ok", children: t("installed") }),
      isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_badge pxm_badge_active", children: t("active") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_name", title: label, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_sub", children: pet.submittedBy ? t("by").replace("{{author}}", pet.submittedBy) : pet.kind }),
    installed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_cardactions", children: renaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_rename", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          autoFocus: true,
          value: renameValue,
          onChange: (e) => onRenameChange(e.target.value),
          placeholder: t("renamePlaceholder"),
          className: "pxm_input"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_outline", disabled: busy, onClick: onCommitRename, children: t("install") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_ghost", disabled: busy, onClick: onCancelRename, children: "\u2715" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_toggle", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: installed.enabled,
            disabled: busy,
            onChange: (e) => onToggle(e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_muted", children: installed.enabled ? t("enabled") : t("disabled") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_cardbtns", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_outline", disabled: busy, onClick: onStartRename, children: t("rename") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_danger", disabled: busy, onClick: onDelete, children: t("delete") })
      ] }),
      isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_hint", children: t("activeHint") })
    ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_primary", disabled: installing, onClick: onInstall, children: installing ? t("installing") : t("install") })
  ] });
}
function InstalledPetCard(props) {
  const { inst, isActive, busy, renaming, renameValue, onRenameChange, onToggle, onDelete, onStartRename, onCommitRename, onCancelRename } = props;
  const t = (k) => PETDEX_COPY[k] ?? k;
  const label = inst.buddyName || inst.displayName;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: isActive ? "pxm_card pxm_card_active" : "pxm_card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_cardmedia", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetPreview, { src: installedSpriteSrc(inst.id), size: 88, frameWidth: inst.frameWidth, frameHeight: inst.frameHeight }),
      isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_badge pxm_badge_active", children: t("active") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pxm_name", title: label, children: label }),
    renaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_rename", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          autoFocus: true,
          value: renameValue,
          onChange: (e) => onRenameChange(e.target.value),
          placeholder: t("renamePlaceholder"),
          className: "pxm_input"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_outline", disabled: busy, onClick: onCommitRename, children: t("install") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_ghost", disabled: busy, onClick: onCancelRename, children: "\u2715" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_toggle", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: inst.enabled, disabled: busy, onChange: (e) => onToggle(e.target.checked) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pxm_muted", children: inst.enabled ? t("enabled") : t("disabled") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "pxm_cardbtns", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_outline", disabled: busy, onClick: onStartRename, children: t("rename") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "pxm_btn pxm_btn_danger", disabled: busy, onClick: onDelete, children: t("delete") })
      ] }),
      isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "pxm_hint", children: t("activeHint") })
    ] })
  ] });
}
var PETDEX_COPY = {
  title: "Petdex Market",
  desc: "Browse, install, and manage companion pets from the live petdex.dev catalog. Previews are streamed same-origin; only your saved collection is stored locally.",
  tabMarket: "Market",
  tabCollected: "Collected",
  clearCache: "Clear cache",
  clearingCache: "Clearing\u2026",
  collected: "Collected",
  empty: "Nothing collected yet. Install a pet from the Market tab.",
  market: "Market",
  search: "Search pets\u2026",
  sortLabel: "Sort",
  sortMostLiked: "Most liked",
  sortCurated: "Curated",
  sortNewest: "Newest",
  sortMostInstalled: "Most installed",
  sortAlphabetical: "Alphabetical",
  indexBuilding: "Building the popularity index\u2026 sorting will apply automatically in a few seconds.",
  loading: "Loading market\u2026",
  showMore: "Show more",
  totalCount: "{{count}} pets in the catalog",
  installed: "Installed",
  active: "Active",
  rename: "Rename",
  delete: "Delete",
  enabled: "Enabled",
  disabled: "Disabled",
  install: "Install",
  installing: "Installing\u2026",
  renamePlaceholder: "Pet name",
  activeHint: "This is your active pet.",
  by: "by {{author}}",
  desktop: "Desktop pet",
  desktopDesc: "Render the active pet as a floating window that walks across your screen. Only one pet can be active at a time.",
  petSize: "Pet size",
  petSizeDesc: "Render scale of the desktop pet (40% \u2013 250%).",
  petSizeSmall: "Small",
  petSizeLarge: "Large",
  petSizeValue: "{{value}}%",
  petLiveliness: "Liveliness",
  petLivelinessDesc: "How active the pet is on your screen. High = wanders often; low = mostly sits still.",
  petLivelinessCalm: "Calm",
  petLivelinessLively: "Lively",
  petLivelinessValue: "{{value}}%",
  bubble: "Speech bubble",
  bubbleDesc: "Pop a speech bubble when a session completes a reply. The pet still animates when disabled."
};
var inject = ["slots"];
function apply(ctx) {
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "petdex",
        order: 80,
        label: () => "Petdex",
        children: {}
      },
      PetdexSection
    )
  );
}


    return module.exports;
  }
});
