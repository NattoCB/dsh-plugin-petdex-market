// Build script: bundle client_src.tsx -> client/client.js wrapped for DSH's
// window.__ModuleLoader__ (same shape as the weixin-bridge plugin client).
import { build } from '/tmp/esbuild-build/node_modules/esbuild/lib/main.js';
import { readFileSync, writeFileSync } from 'node:fs';

const out = await build({
  entryPoints: ['client_src.tsx'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  jsx: 'automatic',
  // react is provided by the host module system; keep it external.
  external: ['react', 'react/jsx-runtime'],
  write: false,
  logLevel: 'info',
});
const code = out.outputFiles[0].text;

const css = `
.pxm_section{width:100%;max-width:980px;display:flex;flex-direction:column;gap:20px;color:var(--dsw-alias-label-primary);font-family:inherit}
.pxm_title{margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em}
.pxm_desc{margin:4px 0 0;font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.pxm_err{color:var(--dsw-alias-state-error-primary);font-size:13px;background:var(--dsw-alias-state-error-muted);padding:8px 12px;border-radius:8px}
.pxm_muted{color:var(--dsw-alias-label-tertiary);font-size:12px}
.pxm_tabs{display:flex;align-items:center;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.pxm_tab{background:none;border:none;cursor:pointer;padding:8px 12px;font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary);border-bottom:2px solid transparent;margin-bottom:-1px}
.pxm_tab_on{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-state-business-primary)}
.pxm_tabspacer{margin-left:auto}
.pxm_cachemsg{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.pxm_space{display:flex;flex-direction:column;gap:14px}
.pxm_h3{margin:0;font-size:15px;font-weight:600}
.pxm_markethead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.pxm_markettools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pxm_sort{max-width:180px;padding:6px 10px;font-size:13px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}
.pxm_sort:focus{border-color:var(--dsw-alias-state-business-primary)}
.pxm_search{width:260px;max-width:100%;padding:6px 12px;font-size:13px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}
.pxm_search:focus{border-color:var(--dsw-alias-state-business-primary)}
.pxm_loading{padding:48px 0;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px}
.pxm_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.pxm_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:14px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;min-width:0}
.pxm_card_active{box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary)}
.pxm_cardmedia{position:relative;display:flex;align-items:center;justify-content:center;width:96px;height:104px}
.pxm_badge{position:absolute;border-radius:999px;padding:2px 6px;font-size:9px;font-weight:600}
.pxm_badge_ok{top:-8px;right:-8px;background:var(--dsw-alias-state-success-muted);color:var(--dsw-alias-state-success-primary)}
.pxm_badge_active{top:auto;right:auto;bottom:-8px;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--dsw-alias-state-business-primary);color:#fff;padding:2px 8px;font-size:9px;font-weight:600}
.pxm_name{font-size:14px;font-weight:500;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pxm_sub{font-size:10px;color:var(--dsw-alias-label-tertiary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pxm_cardactions{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:4px;min-width:0}
.pxm_toggle{display:flex;align-items:center;gap:6px}
.pxm_cardbtns{display:flex;flex-wrap:wrap;gap:6px;width:100%;min-width:0}
.pxm_hint{font-size:10px;color:var(--dsw-alias-label-tertiary);margin:0}
.pxm_rename{display:flex;align-items:center;flex-wrap:wrap;gap:4px;width:100%;min-width:0}
.pxm_input{flex:1;min-width:64px;padding:4px 8px;font-size:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);outline:none}
.pxm_input:focus{border-color:var(--dsw-alias-state-business-primary)}
.pxm_btn{font:inherit;cursor:pointer;border-radius:6px;padding:4px 8px;font-size:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);min-width:0;white-space:nowrap}
.pxm_btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.pxm_btn:disabled{opacity:.55;cursor:default}
.pxm_btn_primary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:#fff;width:100%;margin-top:4px}
.pxm_btn_outline{border:1px solid var(--dsw-alias-border-l2);flex:1 1 auto}
.pxm_btn_ghost{border-color:transparent;background:none;flex:0 0 auto}
.pxm_btn_danger{color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-border-l2);flex:1 1 auto}
.pxm_showmore{display:flex;justify-content:center;padding-top:8px}
.pxm_setrow{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px}
.pxm_setlabel{display:flex;flex-direction:column;gap:2px;min-width:0}
.pxm_setname{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
.pxm_setdesc{font-size:12px;color:var(--dsw-alias-label-tertiary);margin:0;max-width:520px;line-height:1.45}
.pxm_check{width:16px;height:16px;flex:0 0 auto;accent-color:var(--dsw-alias-state-business-primary);margin-top:2px}
.pxm_range{display:flex;flex-direction:column;gap:4px;width:210px;flex:0 0 auto}
.pxm_rangemarks{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-tertiary);gap:8px}
.pxm_rangeval{font-weight:600;color:var(--dsw-alias-label-primary)}
.pxm_range input[type="range"]{width:100%;accent-color:var(--dsw-alias-state-business-primary)}
`;

const wrapped = `window.__ModuleLoader__.load({
  id: "@jasper/dsh-plugin-petdex-market",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    let react_jsx_runtime = require("react/jsx-runtime");

    // ── Scoped CSS ──
    const css = ${JSON.stringify(css)};
    const tagId = "@jasper/dsh-plugin-petdex-market/settings.css";
    if (typeof document !== "undefined" && !document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]")) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "@jasper/dsh-plugin-petdex-market";
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    // ── Bundled module ──
${code}

    return module.exports;
  }
});
`;

writeFileSync('client/client.js', wrapped);
console.log('wrote client/client.js (' + wrapped.length + ' bytes)');
