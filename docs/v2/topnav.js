/* topnav.js
   One account menu for every page.

   The panel used to be copied into each file by hand, which is exactly how
   three pages ended up carrying a redesign and seven did not. This owns the
   panel and nothing else: each page keeps its own trigger button — a name, an
   initial, an avatar, whatever that header calls for — and its own open/close
   handler, which toggles `.open` on #profileMenu the same as it always did.

   Include it anywhere there is a <div class="menu" id="profileMenu">. Whatever
   is inside that div is replaced; the page's own styles for the old panel go
   unused rather than fighting, because this stylesheet is appended last.
*/
(function (root, doc) {
  'use strict';

  /* Fallbacks on every token: this lands on pages that predate the v2 palette
     and it must not depend on them having been converted first. */
  var FACE = 'Manrope,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

  var CSS = [
    /* ---- THE BAR ----
       Position, size, face and weight are fixed here so the wordmark and the
       person land in the same place on every screen. Colour and background
       deliberately are not: a bar over the painted sky and a bar over a hero
       photograph need their own, and nothing about them is inconsistent. */
    /* Width and horizontal padding stay with the page. Every screen sets its
       own content container — 1440 on the PDP and results, 1240 on bookings,
       860 on profile — and a bar that imposed one number would sit out of line
       with the content under it on all the others. What is fixed is the
       anchoring: wordmark hard against the content's left edge, person hard
       against its right. */
    '.topnav-in{height:64px;display:flex;align-items:center;gap:10px;}',
    '@media(max-width:760px){.topnav-in{height:58px;}}',
    '.tn-brand{font-family:' + FACE + ';font-size:17px;font-weight:800;',
    '  letter-spacing:.01em;line-height:1;text-decoration:none;white-space:nowrap;}',
    '.tn-right{margin-left:auto;display:flex;align-items:center;gap:8px;position:relative;}',
    /* the account is a name, not an initial — the mock is a single real person */
    '.tn-who{display:inline-flex;align-items:center;gap:7px;border:none;background:none;',
    '  padding:7px 10px;border-radius:10px;font-family:' + FACE + ';font-size:14.5px;',
    '  font-weight:600;color:inherit;cursor:pointer;transition:background .15s;line-height:1.2;}',
    '.tn-who:hover{background:rgba(0,0,0,.045);}',
    '.tn-who .cv{width:9px;height:9px;stroke:currentColor;opacity:.55;fill:none;stroke-width:2.2;',
    '  stroke-linecap:round;stroke-linejoin:round;flex:none;}',

    /* ---- THE PANEL ---- */
    '.menu{position:absolute;top:calc(100% + 8px);right:0;width:308px;background:#fff;',
    '  border:1px solid var(--line,#e8e8e6);border-radius:18px;box-shadow:0 18px 48px rgba(0,0,0,.18);',
    '  padding:0;overflow:hidden;text-align:left;color:var(--ink,#111827);',
    '  opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .15s,transform .15s;}',
    '.menu.open{opacity:1;transform:none;pointer-events:auto;}',
    /* Held only across the recalc that first hides the panel — see init(). */
    '.menu.tn-boot{transition:none;}',
    '.menu .pm-top{padding-bottom:16px;text-align:center;}',
    '.menu .pm-band{height:78px;position:relative;overflow:hidden;background:#2b9068;}',
    /* flowing ribbons with a dotted spine, not a diamond field */
    '.menu .pm-band::before{content:"";position:absolute;inset:-30%;',
    '  background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'76\'%3E%3Cg fill=\'none\' stroke=\'%23ffffff\' stroke-linecap=\'round\'%3E%3Cpath d=\'M-16 58 C 14 16 44 14 72 38 S 122 66 166 24\' stroke-width=\'15\' opacity=\'0.13\'/%3E%3Cpath d=\'M-16 58 C 14 16 44 14 72 38 S 122 66 166 24\' stroke-width=\'2.4\' stroke-dasharray=\'1 8\' opacity=\'0.5\'/%3E%3C/g%3E%3C/svg%3E");',
    '  background-size:150px 76px;transform:rotate(-8deg);}',
    /* the person sits astride the crown */
    '.menu .pm-av{position:relative;display:flex;align-items:center;justify-content:center;',
    '  width:80px;height:80px;margin:-40px auto 0;border-radius:50%;',
    '  background:#cfe7d9;color:#12704f;font-size:30px;font-weight:800;line-height:1;',
    '  border:5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.10);}',
    '.menu .pm-name{display:block;margin-top:11px;font-size:16.5px;font-weight:700;letter-spacing:-.01em;}',
    '.menu .pm-mail{display:block;margin-top:1px;font-size:13.5px;font-weight:500;color:var(--muted,#737373);}',
    /* the rules are inset from the card edge, and one sits under the person too */
    '.menu .pm-sec{position:relative;padding:6px;}',
    '.menu .pm-sec::before{content:"";position:absolute;top:0;left:18px;right:18px;height:1px;',
    '  background:var(--line,#e8e8e6);}',
    '.menu .pm-item{display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:12px;',
    '  font-size:15px;font-weight:600;color:var(--ink,#111827);text-decoration:none;cursor:pointer;',
    '  transition:background .14s;}',
    '.menu .pm-item:hover{background:#f7f7f5;}',
    /* where you already are */
    '.menu .pm-item.on{background:var(--jade-soft,#eef6f1);}',
    '.menu .pm-item svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.7;',
    '  stroke-linecap:round;stroke-linejoin:round;flex:none;}',
    '.menu .pm-tx{display:flex;flex-direction:column;min-width:0;}',
    '.menu .pm-tx em{font-style:normal;font-size:12.5px;font-weight:500;color:var(--muted,#737373);',
    '  margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.menu .pm-ar{margin-left:auto;color:#b8b8b2;font-size:18px;line-height:1;}',
    '.menu .pm-item.danger{color:#c0392b;}'
  ].join('\n');

  var ICON = {
    bag:   '<rect x="2.5" y="7" width="19" height="13.5" rx="2.5"/><path d="M8.5 7V5.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/>',
    heart: '<path d="M12 20.3S3.8 15.4 3.8 9.9A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8.2 1.9c0 5.5-8.2 10.4-8.2 10.4Z"/>',
    card:  '<path d="M3 9V7.2a2 2 0 0 1 1.6-2l11-2.1A1.4 1.4 0 0 1 17.3 4.5V6"/><rect x="3" y="6.8" width="18" height="13.4" rx="2.6"/><circle cx="16.6" cy="13.5" r="1.4"/>',
    gear:  '<circle cx="12" cy="12" r="3.3"/><path d="M12 2.6v2.3M12 19.1v2.3M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.6 12h2.3M19.1 12h2.3M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"/>',
    help:  '<path d="M4 14v-2.2a8 8 0 1 1 16 0V14"/><rect x="2" y="13.4" width="4.4" height="6.4" rx="2.2"/><rect x="17.6" y="13.4" width="4.4" height="6.4" rx="2.2"/><path d="M19.8 19.8a2.8 2.8 0 0 1-2.8 2.8h-3"/>',
    exit:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
  };

  /* Grouped by what each group is for, not by importance. */
  var GROUPS = [
    [ { href: 'bookings.html', label: 'Bookings', icon: 'bag', sub: true, arrow: true },
      { href: '#', label: 'Saved stays', icon: 'heart' } ],
    [ { href: '#', label: 'Payments and refunds', icon: 'card' },
      { href: 'profile.html', label: 'Account settings', icon: 'gear' } ],
    [ { href: 'help.html', label: 'Help and support', icon: 'help' },
      { href: 'home-loggedout.html', label: 'Log out', icon: 'exit', danger: true } ]
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* The person is the "Myself" record in the travellers store — the same one
     the guest picker and the profile page write to. Read here rather than
     waited for, so the panel never depends on which script ran first. The
     account is a single real person, so a literal "You" is not a name. */
  var TKEY = 'onto:travellers:v3';
  function readUserName() {
    try {
      var a = JSON.parse(root.localStorage.getItem(TKEY)) || [];
      var me = a.filter(function (t) { return t.relation === 'Myself' || t.id === 't-you'; })[0];
      if (me && me.name && me.name.toLowerCase() !== 'you' && me.name.indexOf('@') < 0) {
        return me.name;
      }
    } catch (e) {}
    return '';
  }

  function here() {
    var p = (root.location.pathname || '').split('/').pop();
    return p || 'index.html';
  }

  /* The soonest stay, so the Bookings row says what is behind it rather than
     only where it goes. Only where the model is loaded; everywhere else the
     row is simply a row. */
  function nextStay() {
    var T = root.Tracking;
    if (!T || !T.sorted) return '';
    try {
      var n = T.sorted()[0];
      return n ? n.property_name_raw + ' — ' + T.fmt.day(n.check_in) : '';
    } catch (e) { return ''; }
  }

  function itemHTML(it, page) {
    var on = it.href.split('?')[0] === page ? ' on' : '';
    var body = it.sub
      ? '<span class="pm-tx">' + esc(it.label) + '<em id="pmNext"></em></span>'
      : esc(it.label);
    return '<a class="pm-item' + (it.danger ? ' danger' : '') + on + '" href="' + esc(it.href) + '">' +
             '<svg viewBox="0 0 24 24">' + ICON[it.icon] + '</svg>' + body +
             (it.arrow ? '<span class="pm-ar">&rsaquo;</span>' : '') +
           '</a>';
  }

  function build(menu) {
    var page = here();
    /* The store first; then whatever the page had already resolved into the
       old panel, for anywhere that keeps its name somewhere else. */
    var prev = menu.querySelector('#menuName');
    var name = readUserName() || (prev && prev.textContent.trim()) || 'Saanvi';
    var initial = (name.charAt(0) || 'S').toUpperCase();

    menu.innerHTML =
      '<div class="pm-top">' +
        '<div class="pm-band" aria-hidden="true"></div>' +
        '<span class="pm-av" id="menuAvatar">' + esc(initial) + '</span>' +
        '<b class="pm-name" id="menuName">' + esc(name) + '</b>' +
        '<span class="pm-mail">xyz@email.com</span>' +
      '</div>' +
      GROUPS.map(function (g) {
        return '<div class="pm-sec">' + g.map(function (it) {
          return itemHTML(it, page);
        }).join('') + '</div>';
      }).join('');

    var sub = menu.querySelector('#pmNext');
    if (sub) sub.textContent = nextStay();
  }

  /* Bring whatever markup the page happens to have up to the one shape: the
     wordmark carrying .tn-brand, and the trigger a name with a chevron rather
     than an initial in a coloured disc. */
  function normaliseBar() {
    var brand = doc.querySelector('.tn-brand') || doc.querySelector('.brand');
    if (brand) {
      brand.classList.add('tn-brand');
      /* Only where the wordmark is the whole of the link. Some bars carry a
         compound — ONTO / Stays in Goa — and that is theirs to keep. */
      if (!brand.childElementCount && /^\s*onto\s*$/i.test(brand.textContent)) {
        brand.textContent = 'ONTO';
      }
    }

    var btn = doc.getElementById('profileBtn');
    if (!btn) return;
    btn.className = 'tn-who';
    btn.innerHTML = esc(readUserName() || 'Saanvi') +
      '<svg class="cv" viewBox="0 0 12 12"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';
  }

  function init() {
    var menu = doc.getElementById('profileMenu');

    /* Pages that declare .menu in their own stylesheet — home.html, help.html,
       trips.html, results.html — are hidden from first parse. Pages that leave
       the panel entirely to this file — home2.html, flights.html — have a
       plain, fully opaque div until the stylesheet below lands. At that moment
       opacity goes 1 → 0, and because a transition is declared on it, the
       browser animates the change: the panel it has just been given fades out
       in front of the reader, once per navigation.

       Pinning transition:none across that first recalc removes the animation
       without removing it from real opens. It has to go on before the sheet
       does, so the hidden state and the suppression arrive together. */
    if (menu) menu.classList.add('tn-boot');

    /* The stylesheet goes down wherever this is included, panel or no panel:
       results.html renders its menu through React and has to own its own
       markup, but it should not also own its own copy of the design. */
    var style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.appendChild(style);

    normaliseBar();

    if (!menu) return;
    menu.setAttribute('role', 'menu');
    build(menu);

    /* Two frames: the first commits the hidden state, the second releases the
       transition so the next open still animates. Releasing in one frame can
       land in the same recalc and start the fade after all. */
    if (root.requestAnimationFrame) {
      root.requestAnimationFrame(function () {
        root.requestAnimationFrame(function () { menu.classList.remove('tn-boot'); });
      });
    } else {
      menu.classList.remove('tn-boot');
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
