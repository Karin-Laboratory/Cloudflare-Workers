/**
 * Karin Chrome-style Tab Skin for Homepage and Notepad.
 * The original Workers remain unchanged and retain their D1 / Durable Object
 * bindings. This worker changes ONLY the two HTML documents at the edge.
 *
 * Remove the two zone routes to restore the exact prior UI.
 */
const common = `
  :is(.tab-wrap, .tab) {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0;
    height: 36px;
    min-height: 36px;
    padding: 0 7px 0 11px;
    margin-right: 0;
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
    background: transparent;
    box-shadow: none;
    transition: background-color .13s ease, border-color .13s ease;
  }
  :is(.tab-wrap, .tab):not(.active):not(:hover) {
    box-shadow: inset -1px 0 var(--kt-separator);
  }
  :is(.tab-wrap, .tab):not(.active):hover {
    background: var(--kt-hover);
  }
  :is(.tab-wrap, .tab).active {
    z-index: 2;
    background: var(--kt-active);
    border-color: var(--kt-edge);
    box-shadow: 0 2px 0 var(--kt-active);
  }
  :is(.desktop-tab, .tabname) {
    color: var(--kt-text);
    line-height: 20px;
    font-family: "Segoe UI", "Yu Gothic UI", Meiryo, sans-serif;
    font-size: 12.5px;
    font-weight: 400;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: left;
    border: 0;
    background: transparent;
    min-width: 0;
  }
  :is(.tab-wrap, .tab).active :is(.desktop-tab, .tabname) {
    color: var(--kt-active-text);
    font-weight: 500;
  }
  :is(.desktop-tab, .tabname):focus-visible,
  :is(.tab-control, .tabclose, .tab-add, #plus):focus-visible {
    outline: 2px solid var(--kt-focus);
    outline-offset: -2px;
  }
  :is(.tab-control, .tabclose) {
    width: 25px;
    min-width: 25px;
    height: 25px;
    padding: 0;
    display: inline-grid;
    place-items: center;
    flex: none;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--kt-text);
    line-height: 1;
    font-size: 16px;
  }
  :is(.tab-control, .tabclose):hover {
    background: var(--kt-close-hover);
  }
  :is(.tab-add, #plus) {
    flex: none;
    align-self: center;
    width: 29px;
    min-width: 29px;
    height: 29px;
    margin: 0 0 3px 5px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--kt-text);
    font-size: 21px;
    font-weight: 400;
    line-height: 29px;
    text-align: center;
    padding: 0;
    box-shadow: none;
  }
  :is(.tab-add, #plus):hover {
    background: var(--kt-hover);
  }
  @media (prefers-reduced-motion: reduce) {
    :is(.tab-wrap, .tab) { transition: none; }
  }
`;

const homepage = `
  :root {
    --kt-active: #354960;
    --kt-edge: #50627a;
    --kt-hover: #2f4257;
    --kt-separator: #4a5d75;
    --kt-text: #c7d6e8;
    --kt-active-text: #ffffff;
    --kt-close-hover: #5a6981;
    --kt-focus: #b4d5fd;
  }
  #desktopTabs.desktop-tabs {
    align-items: flex-end;
    gap: 4px;
    min-height: 47px;
    padding-top: 10px;
    padding-bottom: 0;
    background: #202c3d;
    border-bottom: 1px solid #50627a;
  }
  #desktopTabs .tab-wrap {
    filter: none;
    isolation: auto;
    transform: none;
    overflow: hidden;
    max-width: 246px;
    cursor: grab;
  }
  #desktopTabs .tab-wrap::before,
  #desktopTabs .tab-wrap::after {
    content: none;
    clip-path: none;
    filter: none;
  }
  #desktopTabs .tab-wrap.active {
    filter: none;
    background: var(--kt-active);
    border-bottom: 0;
  }
  #desktopTabs .desktop-tab {
    display: block;
    max-width: 175px;
    padding: 7px 8px 7px 0;
    cursor: pointer;
  }
  #desktopTabs .desktop-tab::before {
    content: "";
    display: inline-block;
    vertical-align: -2px;
    margin-right: 8px;
    width: 14px;
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(145deg,#74b9e7,#32699f);
    box-shadow: inset 0 0 0 1px #ffffff4d;
  }
  #desktopTabs .tab-control {
    color: var(--kt-text);
    position: relative;
    z-index: 1;
    padding: 0;
    line-height: 1;
  }
  #desktopTabs .tab-wrap.tabdrag,
  #desktopTabs .tab-wrap.tab-before,
  #desktopTabs .tab-wrap.tab-after {
    outline: 2px solid #efc877;
    outline-offset: -2px;
  }
  #desktopTabs .tab-wrap.dragging-tab { opacity: .4; }
  #desktopTabs .tab-add {
    margin: 0 0 4px 4px;
    border: 0;
    color: var(--kt-text);
    background: transparent;
  }
  @media(max-width: 570px) {
    #desktopTabs.desktop-tabs { padding-top: 8px; min-height: 44px; }
    #desktopTabs .tab-wrap { max-width: 196px; }
    #desktopTabs .desktop-tab { max-width: 126px; }
  }
`;

const notepad = `
  .app {
    --kt-active: var(--bg);
    --kt-edge: var(--edge);
    --kt-hover: var(--hover);
    --kt-separator: var(--edge);
    --kt-text: var(--fg);
    --kt-active-text: var(--fg);
    --kt-close-hover: var(--hover);
    --kt-focus: var(--accent);
  }
  @media (min-width: 701px) and (pointer: fine), (min-width: 901px) {
    .app header {
      height: 48px;
      padding-top: 9px;
      gap: 5px;
      align-items: flex-end;
      border-bottom: 1px solid var(--edge);
    }
    .app header #tabs {
      align-items: flex-end;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .app header .tab {
      width: 196px;
      min-width: 112px;
      max-width: 196px;
      padding: 0 5px 0 11px;
    }
    .app header .tab.active {
      background: var(--bg);
      border-bottom: 0;
    }
    .app header .tabname {
      flex: 1;
      display: block;
      padding: 8px 3px 8px 0;
      text-overflow: ellipsis;
    }
    .app header .tabname::before {
      content: "";
      display: inline-block;
      vertical-align: -2px;
      width: 14px;
      height: 14px;
      margin-right: 8px;
      border-radius: 3px;
      background: linear-gradient(145deg,#69a7df,#337ab7);
      box-shadow: inset 0 0 0 1px #ffffff62;
    }
    .app header .tabclose { font-size: 17px; }
    .app header #plus,
    .app header #theme {
      align-self: center;
      margin-bottom: 3px;
    }
    .app header .logo,
    .app header .brand { align-self: center; margin-bottom: 3px; }
  }
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isHomepage = url.hostname === 'homepage.karin-lab.com';
    const isNotepad = url.hostname === 'notepad.karin-lab.com';
    if (!isHomepage && !isNotepad) {
      return new Response('Not found', { status: 404 });
    }
    const origin = isHomepage ? env.HOMEPAGE : env.NOTEPAD;
    const response = await origin.fetch(request);
    if (request.method !== 'GET' || response.status !== 200 ||
        !(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
      return response;
    }
    const rules = common + (isHomepage ? homepage : notepad);
    const rewritten = new HTMLRewriter()
      .on('head', {
        element(element) {
          element.append('<style id="karin-chrome-tabs-v1">\n' + rules + '\n</style>', { html: true });
        }
      })
      .transform(response);
    const headers = new Headers(rewritten.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('cache-control', 'private, no-store');
    return new Response(rewritten.body, { status: rewritten.status, headers });
  }
};
