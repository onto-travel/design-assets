// ---- minimal hotel-switcher pill bar (mockup only) ----
// Single source of truth for all hotel tabs. Rename here once and every page updates.
(function () {
  const HOTELS = [
    { f: 'hotel-firstfold.html', n: 'Taj Exotica · First fold' },
    { f: 'hotel-firstfold-loggedout.html', n: 'Taj Exotica · Logged out' },
  ];
  const here = location.pathname.split('/').pop() || 'hotel-firstfold.html';

  const css = `
    .hoteltabs{position:fixed;top:0;left:0;width:174px;height:100vh;z-index:60;box-sizing:border-box;
      display:flex;flex-direction:column;align-items:stretch;gap:8px;
      padding:18px 14px;overflow-y:auto;
      background:rgba(239,234,225,.94);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      border-right:1px solid #e7e1d6;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
    .hoteltabs a{font-size:13px;line-height:1.3;color:#5b5650;text-decoration:none;
      padding:10px 13px;border-radius:12px;border:1px solid #e2dccf;background:#fff;
      transition:all .15s;}
    .hoteltabs a:hover{border-color:#c9c0ae;}
    .hoteltabs a.active{background:#2f4f74;color:#fff;border-color:#2f4f74;}
    body{padding-left:174px;}
    @media(max-width:760px){
      .hoteltabs{position:sticky;width:auto;height:auto;flex-direction:row;flex-wrap:wrap;
        align-items:center;gap:8px;padding:9px 20px;overflow:visible;
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
