// ---- minimal hotel-switcher pill bar (mockup only) ----
// Single source of truth for all hotel tabs. Rename here once and every page updates.
(function () {
  const HOTELS = [
    { f: 'hotel-firstfold.html', n: 'Logged in' },
    { f: 'hotel-firstfold-loggedout.html', n: 'Logged out' },
  ];
  const here = location.pathname.split('/').pop() || 'hotel-firstfold.html';

  const css = `
    .hoteltabs{position:fixed;top:0;left:0;width:112px;height:100vh;z-index:60;box-sizing:border-box;
      display:flex;flex-direction:column;align-items:stretch;gap:6px;
      padding:12px 9px;overflow-y:auto;
      background:rgba(239,234,225,.9);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      border-right:1px solid #e7e1d6;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
    .hoteltabs a{font-size:11px;line-height:1.25;color:#7c7771;text-decoration:none;
      padding:6px 9px;border-radius:8px;border:1px solid #e2dccf;background:#fff;
      transition:all .15s;}
    .hoteltabs a:hover{border-color:#c9c0ae;color:#5b5650;}
    .hoteltabs a.active{background:#2f4f74;color:#fff;border-color:#2f4f74;}
    body{padding-left:112px;}
    @media(max-width:760px){
      .hoteltabs{position:sticky;width:auto;height:auto;flex-direction:row;flex-wrap:wrap;
        align-items:center;gap:6px;padding:7px 16px;overflow:visible;
        border-right:none;border-bottom:1px solid #e7e1d6;}
      .hoteltabs a{white-space:nowrap;}
      body{padding-left:0;}
    }`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'hoteltabs';
  nav.innerHTML = HOTELS.map(h =>
    `<a href="${h.f}"${h.f === here ? ' class="active"' : ''}>${h.n}</a>`
  ).join('');

  function mount() { document.body.insertBefore(nav, document.body.firstChild); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
