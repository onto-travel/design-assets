/* guest-picker.js — the one shared Guests popover for the booking mockups.
   Used by hotel-firstfold.html, checkout.html and hotel-firstfold-loggedout.html;
   results.html has its own React copy of the same behaviour.

   The page keeps only the trigger chip (#guestChip with #guestVal / #guestSub inside)
   and an empty shell:  <div class="guest-pop" id="guestPop" hidden></div>
   init() injects the CSS, renders the popover internals and wires everything.

   GuestPicker.init({
     loggedOut:  false,   // true → no saved companions, no persistence, seed 2 anonymous adults
     roomsPanel: true,    // Guests/Rooms segment toggle + rooms stepper panel
     photoChips: false,   // validation chips can jump the hero gallery to a photo
     validate:   'match'  // 'match' → "% match for this trip" + fit chips; 'generic' → review score + highlights
   })

   Party model: Adults (18+) and Children (under 18). Each child chip reads
   "Name · 7 yrs ⌄" — the age is part of the pill with a dot separator, and
   tapping it opens an inline tray of 0…17 pill tokens on the line below (exact
   year, no buckets — the backend wants the real age). Until an age is picked
   the whole chip goes amber and reads "· add age". */
(function(){
  'use strict';

  /* ---------- component CSS (canonical — pages carry no picker styles) ---------- */
  const CSS = `
  .guest-pop{
    position:absolute;top:calc(100% + 8px);right:0;width:322px;max-width:90vw;z-index:40;
    background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 36px rgba(40,30,10,.18);
    padding:14px;
  }
  .guest-pop[hidden]{display:none;}
  .gp-lab{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:2px 2px 9px;}
  .gp-reg{padding-bottom:13px;margin-bottom:4px;border-bottom:1px solid var(--line);}
  .gp-reg:has(> .gp-chips:empty){display:none;}
  .gp-chips{display:flex;flex-wrap:wrap;gap:7px;}
  .reg-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:20px;
    padding:6px 11px 6px 10px;font-size:12.5px;font-weight:600;color:var(--ink);background:#fff;
    cursor:pointer;font-family:inherit;transition:all .15s;}
  .reg-chip:hover{border-color:var(--jade);background:#eef6f1;}
  .reg-chip .rc-em{font-size:14px;}
  .reg-chip .rc-plus{color:var(--jade);font-weight:700;font-size:14px;margin-left:1px;}
  .gp-allin{font-size:12.5px;color:var(--muted);padding:2px;}
  .gp-catg{padding:11px 0 4px;}
  .gp-catg + .gp-catg{border-top:1px solid var(--line);}
  .gp-chead{display:flex;align-items:center;padding:0 2px 2px;}
  .gp-chead .gpc-name{font-size:14.5px;font-weight:600;color:var(--ink);}
  .gp-chead .gpc-sub{font-size:12px;color:var(--muted);}
  .gp-chead .gpc-sub::before{content:"·";margin:0 6px;color:#c3bcae;}
  .gp-chead .gpc-count{margin:0 3px;font-size:12.5px;font-weight:700;color:var(--jade);
    min-width:26px;height:22px;padding:0 7px;border-radius:11px;background:#eef6f1;
    display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums;}
  .gp-people{display:flex;flex-wrap:wrap;gap:6px;padding:9px 2px 4px;}
  .gp-people:empty{display:none;}
  .person{display:inline-flex;align-items:center;gap:5px;border:1px solid #cdd8e6;border-radius:20px;
    padding:5px 5px 5px 11px;font-family:inherit;font-size:12.5px;font-weight:600;color:var(--jade);background:#eef6f1;}
  .person:not(.is-comp){background:#faf8f3;border-color:#e4dcc9;color:var(--ink);}
  .person .person-em{font-size:14px;}
  .person .person-name{border:none;background:none;font:inherit;color:inherit;cursor:pointer;padding:0;
    border-bottom:1px dashed #c9c0ae;}
  .person.custom .person-name{border-bottom-color:transparent;}
  .person .person-x{border:none;background:none;cursor:pointer;color:#9a948c;font-size:17px;line-height:1;
    padding:0 3px;border-radius:50%;transition:color .15s;}
  .person .person-x:hover{color:#d64545;}
  .person-in{width:118px;border:1px solid var(--jade);border-radius:20px;padding:5px 12px;font-family:inherit;
    font-size:12.5px;font-weight:600;color:var(--ink);background:#fff;outline:none;}
  .person .age-sep{opacity:.55;}
  /* the age opens an inline token row, not a menu — a grid of numbers here would read
     as the date chip's calendar (.cal-grid), which sits 8px away in the same trip bar */
  .person .age-btn{position:relative;border:none;background:none;font:inherit;color:inherit;
    cursor:pointer;padding:0 11px 0 0;outline:none;border-radius:3px;}
  .person .age-btn::after{content:"";position:absolute;right:2px;top:50%;width:4px;height:4px;margin-top:-3px;
    border-right:1.4px solid currentColor;border-bottom:1.4px solid currentColor;transform:rotate(45deg);
    transition:transform .15s;opacity:.7;}
  .person .age-btn[aria-expanded="true"]::after{transform:rotate(-135deg);margin-top:-1px;}
  .person .age-btn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
  .person.age-unset{background:#fbf3e2;border-color:#d8c9a4;color:#7a5f28;}
  /* ragged wrapped pills, deliberately not a fixed column count */
  .age-tray{flex:0 0 100%;display:flex;flex-wrap:wrap;gap:5px;margin:1px 0 3px;padding:8px 8px 9px;
    border:1px solid #e4dcc9;border-radius:12px;background:#fdfcf8;}
  .age-tray .age-tray-lab{flex:0 0 100%;font-size:11px;font-weight:700;letter-spacing:.06em;
    text-transform:uppercase;color:var(--muted);margin:0 1px 2px;}
  .age-tok{border:1px solid var(--line);border-radius:20px;background:#fff;color:var(--ink);
    font-family:inherit;font-size:12.5px;font-weight:600;line-height:1;padding:6px 10px;cursor:pointer;
    font-variant-numeric:tabular-nums;transition:all .12s;}
  .age-tok:hover{border-color:var(--jade);background:#eef6f1;color:var(--jade);}
  .age-tok[aria-pressed="true"]{background:var(--jade);border-color:var(--jade);color:#fff;}
  .age-tok:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
  .gp-chead .gp-add,.gp-chead .gp-minus{flex:none;width:25px;height:25px;padding:0;border-radius:50%;
    border:1px solid var(--line);background:#fff;color:var(--jade);font-size:17px;line-height:1;
    cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;}
  .gp-chead .gp-minus{margin-left:auto;}
  .gp-chead .gp-add:hover,.gp-chead .gp-minus:hover{border-color:var(--jade);background:#eef6f1;}
  .gp-chead .gp-add:disabled,.gp-chead .gp-minus:disabled{opacity:.4;cursor:default;}
  /* draw +/- as centred strokes — font glyphs never optically centre in a small circle */
  .gp-ic{display:block;width:13px;height:13px;}
  .gp-step .gp-ic{width:15px;height:15px;}
  /* guests / rooms toggle at the top of the popover */
  .gp-panel[hidden]{display:none;}
  .gp-seg{display:flex;gap:4px;background:#f2efe7;border-radius:10px;padding:3px;margin-bottom:12px;}
  .gp-seg-btn{flex:1;border:none;background:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--muted);
    padding:7px 0;border-radius:8px;cursor:pointer;transition:all .15s;}
  .gp-seg-btn:hover{color:var(--ink);}
  .gp-seg-btn.is-on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(40,30,10,.12);}
  .gp-roomrow{display:flex;align-items:center;gap:14px;padding:6px 2px 2px;}
  .gp-roomrow .gpr-name{font-size:15px;font-weight:600;color:var(--ink);}
  .gp-stepper{margin-left:auto;display:inline-flex;align-items:center;gap:6px;}
  .gp-step{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--jade);
    font-size:20px;line-height:1;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;}
  .gp-step:hover{border-color:var(--jade);background:#eef6f1;}
  .gp-step:disabled{opacity:.4;cursor:default;}
  .gp-stepval{min-width:24px;text-align:center;font-size:15px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;}
  `;

  /* ---------- popover markup ---------- */
  const IC_MINUS = '<svg class="gp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12"/></svg>';
  const IC_PLUS  = '<svg class="gp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>';
  const catgHTML = (label, sub, cat, one, countId, peopleId) =>
    '<div class="gp-catg">'
    + '<div class="gp-chead"><span class="gpc-name">'+label+'</span><span class="gpc-sub">'+sub+'</span>'
    + '<button type="button" class="gp-minus" data-cat="'+cat+'" aria-label="Remove '+one+'">'+IC_MINUS+'</button>'
    + '<span class="gpc-count" id="'+countId+'">0</span>'
    + '<button type="button" class="gp-add" data-cat="'+cat+'" aria-label="Add '+one+'">'+IC_PLUS+'</button></div>'
    + '<div class="gp-people" id="'+peopleId+'"></div></div>';

  function popHTML(opts){
    let h = '';
    if(opts.roomsPanel){
      h += '<div class="gp-seg" role="tablist" aria-label="Guests or rooms">'
        + '<button type="button" class="gp-seg-btn is-on" id="segGuests" role="tab" aria-selected="true">Guests</button>'
        + '<button type="button" class="gp-seg-btn" id="segRooms" role="tab" aria-selected="false">Rooms</button></div>';
    }
    h += '<div class="gp-panel" id="panelGuests">';
    if(!opts.loggedOut){
      h += '<div class="gp-reg"><div class="gp-lab">Regular companions</div><div class="gp-chips" id="regChips"></div></div>';
    }
    h += catgHTML('Adults','Age 18+','adults','adult','adCount','adPeople')
      +  catgHTML('Children','Age 0&ndash;17','children','child','chCount','chPeople')
      +  '</div>';
    if(opts.roomsPanel){
      h += '<div class="gp-panel" id="panelRooms" hidden><div class="gp-roomrow">'
        + '<div class="gpr-name">Rooms</div>'
        + '<div class="gp-stepper" role="group" aria-label="Number of rooms">'
        + '<button type="button" class="gp-step" id="roomPopMinus" aria-label="Fewer rooms"><svg class="gp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 12h12"/></svg></button>'
        + '<span class="gp-stepval" id="roomPopVal">1</span>'
        + '<button type="button" class="gp-step" id="roomPopPlus" aria-label="More rooms"><svg class="gp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg></button>'
        + '</div></div></div>';
    }
    return h;
  }

  /* ---------- behaviour ---------- */
  function init(userOpts){
    const opts = Object.assign({ loggedOut:false, roomsPanel:true, photoChips:false, validate:'match' }, userOpts||{});

    if(!document.querySelector('style[data-guest-picker]')){
      const st = document.createElement('style'); st.setAttribute('data-guest-picker',''); st.textContent = CSS;
      document.head.appendChild(st);
    }

    // the account holder's name lives in the Travellers store ("Myself"); default "Saanvi"
    const TKEY = 'onto:travellers:v3';
    const readUserName = () => { try { const a=JSON.parse(localStorage.getItem(TKEY))||[]; const me=a.find(t=>t.relation==='Myself'||t.id==='t-you'); if(me&&me.name&&me.name.toLowerCase()!=='you'&&!me.name.includes('@')) return me.name; } catch(e){} return 'Saanvi'; };
    const writeUserName = n => { try { let a=JSON.parse(localStorage.getItem(TKEY)); if(!Array.isArray(a)) a=[]; let me=a.find(t=>t.relation==='Myself'||t.id==='t-you'); if(me) me.name=n; else a.unshift({id:'t-you',name:n,relation:'Myself',interests:[]}); localStorage.setItem(TKEY, JSON.stringify(a)); } catch(e){} };
    const FUN_EMOJI = ['🦊','🐨','🐼','🦁','🐧','🐬','🦉','🐢','🐝','🦩'];
    const emojiFor = name => { let h=0; const s=String(name||''); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return FUN_EMOJI[h % FUN_EMOJI.length]; };
    const catFor = t => { if(t.relation==='Myself') return 'adults'; if(typeof t.age==='number') return t.age<18 ? 'children' : 'adults'; if(t.relation==='Child') return 'children'; return 'adults'; };
    // build the picker's companion list from the saved Companions (account holder + everyone they've added)
    const loadCompanions = () => {
      if(opts.loggedOut) return [];   // logged out: no saved profile, so no regular companions
      let arr=[]; try{ arr=JSON.parse(localStorage.getItem(TKEY))||[]; }catch(e){} if(!Array.isArray(arr)) arr=[];
      const me = arr.find(t=>t.relation==='Myself'||t.id==='t-you');
      const list = [{id:'you', em:(me&&me.emoji)||emojiFor(readUserName()), name:readUserName(), cat:'adults', score:95, fits:[]}];
      arr.filter(t=>t.relation!=='Myself'&&t.id!=='t-you').forEach(t=>{
        list.push({id:t.id, em:t.emoji||emojiFor(t.name), name:t.name, cat:catFor(t), score:93, fits:[]});
      });
      return list;
    };
    const COMPANIONS = loadCompanions();
    const BASE_FITS = ["Beachfront","6 restaurants"];
    const EM  = { adults:'🧍', children:'🧒' };
    const FUN = {
      adults:  ["Captain Mango","Wanderer Kai","Skipper Reef","Sunny Coco","Palm Rover"],
      children:["Little Tiger","Coco Pop","Captain Nemo","Sandy Toes","Mango Bean"]
    };
    const MAP = {}; COMPANIONS.forEach(c=>MAP[c.id]=c);
    const CATS   = ['adults','children'];
    const PEOPLE = { adults:'adPeople', children:'chPeople' };
    const COUNT  = { adults:'adCount',  children:'chCount'  };
    const MIN    = { adults:1, children:0 };   // keep at least one adult
    const MAXG   = 9;
    // child age dropdown: every year 0…17, no buckets (1 takes the singular unit)
    const AGE_MIN = 0, AGE_MAX = 17;
    const ageLbl = a => a===1 ? '1 yr' : a+' yrs';

    // each person is {companion:id}  OR  {auto:true, em, name, custom?}; children also carry {age}
    let party = null;
    if(!opts.loggedOut){ try{ party = JSON.parse(sessionStorage.getItem('searchGuests')); }catch(e){} }
    if(!party || !party.adults){
      party = opts.loggedOut
        ? { adults:[{auto:true,em:EM.adults,name:FUN.adults[0]},{auto:true,em:EM.adults,name:FUN.adults[1]}], children:[] }
        : { adults:[{companion:'you'}], children:[] };
    }
    if(!party.children) party.children = [];
    // migrate a stored 3-category party: infants ("under 2") become age-0 children
    if(party.infants){ party.infants.forEach(p=>party.children.push(Object.assign({}, p, {em:EM.children, age:0}))); delete party.infants; }
    // drop any stale companions no longer defined (after removing seeded people)
    CATS.forEach(c=>{ party[c] = party[c].filter(p=> !p.companion || MAP[p.companion]); });
    const funN = { adults: opts.loggedOut ? 2 : 0, children: 0 };

    window.PARTY = window.PARTY || { guests: 3 };
    if(opts.roomsPanel && !window.PARTY.rooms) window.PARTY.rooms = 1;
    // rooms are an explicit choice where the toggle exists; fall back to auto-fit (~2 guests per room)
    window.roomsNeeded = cap => window.PARTY.rooms || Math.max(1, Math.ceil((window.PARTY.guests||1)/(cap||1)));
    if(!opts.loggedOut) window.acctName = readUserName;   // account holder's name for the booking when the form is skipped
    /* renaming the account holder from outside the picker (the PDP's "Booking under
       the name of" sheet) takes the same route the picker's own inline rename does:
       the in-memory entry, then the store, then a re-render. Exporting writeUserName
       alone would persist the name but leave this session's chip reading the old one. */
    if(!opts.loggedOut) window.setAcctName = n => {
      const v = String(n||'').trim(); if(!v) return;
      if(MAP['you']) MAP['you'].name = v;
      writeUserName(v);
      apply();
    };

    const $ = id => document.getElementById(id);
    const pop = $('guestPop'), trigger = $('guestChip');
    pop.innerHTML = popHTML(opts);
    const relGroups = $('relGroups'), scoreEl = $('relScore');

    // a few chips are "shots" — clicking them jumps the gallery to a matching photo
    const CAM = '<svg class="chip-cam" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h3l1.4-2h7.2L17 8.5h3v10H4z"/><circle cx="12" cy="13" r="3"/></svg>';
    const CHIP_PHOTOS = opts.photoChips ? {
      'Beachfront':    'images/06-aerial-pool.png',
      'Sunset dining': 'images/04-pool-sunset.png',
      '6 restaurants': 'images/07-garden-view.png'
    } : {};
    const chipLi = (t,spot)=>{
      const src = CHIP_PHOTOS[t];
      const cls = (spot?'spot':'') + (src?(spot?' ':'')+'shot':'');
      return '<li'+(cls?' class="'+cls+'"':'')+(src?' data-src="'+src+'" role="button" tabindex="0"':'')+'>'+(src?CAM:'')+t+'</li>';
    };
    if(opts.photoChips && relGroups){
      // click / keyboard on a shot chip → swap the hero photo
      relGroups.addEventListener('click', e => {
        const li = e.target.closest('li[data-src]');
        if(li && window.showHeroPhoto){ window.showHeroPhoto(li.dataset.src);
          document.getElementById('top').scrollIntoView({behavior:'smooth',block:'start'}); }
      });
      relGroups.addEventListener('keydown', e => {
        if((e.key==='Enter'||e.key===' ') && e.target.closest('li[data-src]')){ e.preventDefault(); e.target.click(); }
      });
    }

    const joinNames = a => a.length<=1 ? (a[0]||'') : a.slice(0,-1).join(', ')+' & '+a[a.length-1];
    const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const heads = () => CATS.reduce((n,c)=>n+party[c].length,0);
    const usedIds = () => new Set(CATS.flatMap(c=>party[c]).filter(p=>p.companion).map(p=>p.companion));
    const knownIn = () => CATS.flatMap(c=>party[c]).filter(p=>p.companion).map(p=>MAP[p.companion]);
    // index of the last auto-added (non-companion) person — the only kind the "−" removes;
    // saved companions only leave via their own × chip.
    const lastExtraIdx = cat => { const a=party[cat]; for(let i=a.length-1;i>=0;i--){ if(!a[i].companion) return i; } return -1; };

    function addCompanion(id){
      const c = MAP[id]; if(!c || heads()>=MAXG || usedIds().has(id)) return;
      party[c.cat].push({companion:id}); agePick=null; apply();
    }
    function addExtra(cat){
      if(heads()>=MAXG) return;
      party[cat].push({ auto:true, em:EM[cat], name:FUN[cat][funN[cat]++ % FUN[cat].length] }); agePick=null; apply();
    }
    function removePerson(cat,i){
      if(party[cat].length<=MIN[cat]) return;   // adults never drop below 1
      party[cat].splice(i,1); agePick=null; apply();   // indices shift, so any open tray is stale
    }

    // which child chip has its age tray open — {cat,i}, cleared whenever the party changes
    let agePick = null;
    function ageTray(cat,i,p){
      const tray = document.createElement('div');
      tray.className = 'age-tray';
      tray.addEventListener('click', e=>e.stopPropagation());
      const lab = document.createElement('span');
      lab.className = 'age-tray-lab'; lab.textContent = 'Age at check-in';
      tray.appendChild(lab);
      for(let a=AGE_MIN; a<=AGE_MAX; a++){
        const t = document.createElement('button');
        t.type='button'; t.className='age-tok';
        t.setAttribute('aria-pressed', String(p.age===a));
        t.setAttribute('aria-label', ageLbl(a));
        t.textContent = String(a);
        t.addEventListener('click', e=>{
          e.stopPropagation();
          const person = party[cat][i]; if(person) person.age = a;
          agePick = null; apply();
        });
        tray.appendChild(t);
      }
      setTimeout(()=>{ const sel = tray.querySelector('.age-tok[aria-pressed="true"]') || tray.querySelector('.age-tok'); if(sel) sel.focus(); }, 0);
      return tray;
    }

    // inline rename for extra (auto) people
    let editing = null;   // {cat,i}
    function commit(val){
      if(editing){ const p=party[editing.cat][editing.i]; if(p){ const v=(val||'').trim(); if(v){ if(p.companion==='you'){ MAP['you'].name=v; writeUserName(v); } else { p.name=v; p.custom=true; } } } }
      editing = null; apply();
    }

    function renderRegulars(){
      const box = $('regChips'); if(!box) return;
      box.innerHTML='';
      const used = usedIds();
      const avail = COMPANIONS.filter(c=>!used.has(c.id));
      if(!avail.length){ box.innerHTML = '<span class="gp-allin">Everyone’s added ✓</span>'; return; }
      avail.forEach(c=>{
        const b = document.createElement('button'); b.type='button'; b.className='reg-chip';
        b.innerHTML = '<span class="rc-em">'+c.em+'</span>'+esc(c.name)+'<span class="rc-plus">+</span>';
        b.addEventListener('click', ()=>addCompanion(c.id));
        box.appendChild(b);
      });
    }
    function renderPeople(){
      CATS.forEach(cat=>{
        const box = $(PEOPLE[cat]); box.innerHTML='';
        party[cat].forEach((p,i)=>{
          if(editing && editing.cat===cat && editing.i===i){
            const inp = document.createElement('input');
            inp.className='person-in'; inp.value = p.name || (p.companion && MAP[p.companion] ? MAP[p.companion].name : '') || ''; inp.maxLength=24; inp.setAttribute('aria-label','Guest name');
            inp.addEventListener('keydown', e=>{ e.stopPropagation();
              if(e.key==='Enter') commit(inp.value);
              else if(e.key==='Escape'){ editing=null; apply(); } });
            inp.addEventListener('blur', ()=>commit(inp.value));
            setTimeout(()=>{ inp.focus(); inp.select(); }, 0);
            box.appendChild(inp); return;
          }
          const c = p.companion ? MAP[p.companion] : null;
          const em = c ? c.em : p.em, name = c ? c.name : p.name;
          const chip = document.createElement('span');
          chip.className = 'person' + (p.companion ? ' is-comp' : (p.custom?' custom':''));
          const editable = !p.companion || p.companion==='you';
          const nameHTML = editable
            ? '<button type="button" class="person-name" aria-label="Rename">'+esc(name)+'</button>'
            : esc(name);
          const set = typeof p.age==='number';
          const open = !!(agePick && agePick.cat===cat && agePick.i===i);
          if(cat==='children' && !set) chip.classList.add('age-unset');
          const ageHTML = cat==='children'
            ? '<span class="age-sep">·</span>'
              + '<button type="button" class="age-btn" aria-expanded="'+open+'" aria-label="'+esc(name)+' age">'
              + (set ? ageLbl(p.age) : 'add age') + '</button>'
            : '';
          chip.innerHTML = '<span class="person-em">'+em+'</span>'+nameHTML + ageHTML
            + '<button type="button" class="person-x" aria-label="Remove '+esc(name)+'">&times;</button>';
          if(editable) chip.querySelector('.person-name').addEventListener('click', e=>{ e.stopPropagation(); editing={cat,i}; agePick=null; apply(); });
          chip.querySelector('.person-x').addEventListener('click', e=>{ e.stopPropagation(); removePerson(cat,i); });
          if(cat==='children'){
            chip.querySelector('.age-btn').addEventListener('click', e=>{
              e.stopPropagation();
              agePick = open ? null : {cat,i};   // second tap on the same chip closes it
              editing = null;
              apply();
            });
          }
          box.appendChild(chip);
          // the tray sits on its own line directly under the chip it belongs to
          if(open) box.appendChild(ageTray(cat,i,p));
        });
      });
    }

    const plural = (n,w)=> n+' '+w+(n===1?'':'s');
    function composition(){
      const p=[];
      if(party.adults.length)   p.push(plural(party.adults.length,'adult'));
      if(party.children.length) p.push(party.children.length+(party.children.length===1?' child':' children'));
      return p.join(' · ') || 'Add guests';
    }
    function scoreFor(chosen, t){
      let avg = chosen.length ? Math.round(chosen.reduce((s,c)=>s+c.score,0)/chosen.length) : 95;
      if(t>=7) avg = Math.min(avg,83); else if(t>=5) avg = Math.min(avg,90);
      return avg;
    }

    let lastGuests = 0;
    function apply(){
      if(!opts.loggedOut){ try{ sessionStorage.setItem('searchGuests', JSON.stringify(party)); }catch(e){} }
      window.PARTY.guests = heads();
      if(opts.roomsPanel){
        // auto-fit rooms to the party: once guests grow past 2 we add a room (~2 guests each).
        // only bumps UP on an actual guest increase — the user can always reduce it with the stepper.
        const _g = window.PARTY.guests;
        if(_g > lastGuests){
          const rec = Math.max(1, Math.ceil(_g / 2));
          const cur = window.cartCount ? window.cartCount() : ((window.CART && window.CART[0]) ? window.CART[0].qty : 1);
          if(rec > cur && window.setRoomQty) window.setRoomQty(rec);
        }
        lastGuests = _g;
      }
      if(window.refreshPricing) window.refreshPricing();
      CATS.forEach(cat=>{ const el=$(COUNT[cat]); if(el) el.textContent = party[cat].length; });
      renderRegulars(); renderPeople();
      document.querySelectorAll('#guestPop .gp-add').forEach(b=> b.disabled = heads()>=MAXG);
      document.querySelectorAll('#guestPop .gp-minus').forEach(b=>{ const cat=b.dataset.cat; b.disabled = lastExtraIdx(cat) < 0 || party[cat].length <= MIN[cat]; });
      const nm = knownIn().map(c=>c.name);
      const extra = heads() - nm.length;
      $('guestVal').textContent = nm.length ? joinNames(nm)+(extra>0?' +'+extra:'') : composition();
      $('guestSub').textContent = heads()+' guest'+(heads()===1?'':'s');
      // the "% match" / guest-review card is optional — some layouts (v2) drop it,
      // so guard every write or apply() throws and takes the popovers down with it.
      if(scoreEl || relGroups){
        if(opts.validate==='generic'){
          // logged out: no personalisation yet — show the property's guest-review
          // score instead of a "% match", plus generic highlight chips
          if(scoreEl) scoreEl.innerHTML = '<b class="vd-rev-num">94%</b><span class="vd-rev-slash">of guests recommend it</span>';
          if(relGroups) relGroups.innerHTML = '<ul class="vd-chips">'
            + ['Beachfront setting','Standout service','6 restaurants','Lush gardens'].map(c=>chipLi(c)).join('')
            + '</ul>';
        } else {
          const chosen = knownIn();
          if(scoreEl) scoreEl.textContent = scoreFor(chosen, heads()) + '% match for this trip';
          if(relGroups){
            const pills = [];
            chosen.forEach(c => pills.push(...c.fits));
            pills.push(...BASE_FITS);
            const uniq = pills.filter((v,i,a)=>a.indexOf(v)===i);
            relGroups.innerHTML = '<ul class="vd-chips">'+uniq.map(c=>chipLi(c)).join('')+chipLi('Cost sweet spot',true)+'</ul>';
          }
        }
      }
    }

    document.querySelectorAll('#guestPop .gp-add').forEach(b=> b.addEventListener('click', ()=>addExtra(b.dataset.cat)));
    // minus removes only the last auto-added extra; companions stay until their × is clicked
    document.querySelectorAll('#guestPop .gp-minus').forEach(b=> b.addEventListener('click', ()=>{ const i=lastExtraIdx(b.dataset.cat); if(i>=0) removePerson(b.dataset.cat, i); }));

    // Guests / Rooms toggle: two panels share the popover; Guests is the default view
    const segG=$('segGuests'), segR=$('segRooms'), panelG=$('panelGuests'), panelR=$('panelRooms');
    function showPanel(which){
      const rooms = which==='rooms';
      if(panelG) panelG.hidden = rooms;
      if(panelR) panelR.hidden = !rooms;
      if(segG){ segG.classList.toggle('is-on',!rooms); segG.setAttribute('aria-selected', String(!rooms)); }
      if(segR){ segR.classList.toggle('is-on', rooms); segR.setAttribute('aria-selected', String(rooms)); }
    }
    if(segG) segG.addEventListener('click', e=>{ e.stopPropagation(); showPanel('guests'); });
    if(segR) segR.addEventListener('click', e=>{ e.stopPropagation(); showPanel('rooms'); });
    // room stepper (lives on the Rooms panel) drives the cart quantity
    const rpm=$('roomPopMinus'), rpp=$('roomPopPlus');
    const curQty = ()=> window.cartCount ? window.cartCount() : ((window.CART && window.CART[0]) ? window.CART[0].qty : 1);
    if(rpm) rpm.addEventListener('click', e=>{ e.stopPropagation(); if(window.setRoomQty) window.setRoomQty(curQty()-1); });
    if(rpp) rpp.addEventListener('click', e=>{ e.stopPropagation(); if(window.setRoomQty) window.setRoomQty(curQty()+1); });

    const openPop  = ()=>{
      if(window.closeDatePop) window.closeDatePop(); else { const cp=$('calPop'); if(cp) cp.hidden=true; }
      if(window.closeRoomPop) window.closeRoomPop();
      showPanel('guests'); pop.hidden=false; trigger.setAttribute('aria-expanded','true');
    };
    const closePop = ()=>{ editing=null; agePick=null; pop.hidden=true; trigger.setAttribute('aria-expanded','false'); apply(); };
    window.closeGuestPop = closePop;
    trigger.addEventListener('click', e=>{ e.stopPropagation(); pop.hidden?openPop():closePop(); });
    pop.addEventListener('click', e=>e.stopPropagation());
    document.addEventListener('click', e=>{ if(!pop.hidden && !pop.contains(e.target) && !trigger.contains(e.target)) closePop(); });
    // Escape backs out of an open age tray first, and only then the whole popover
    document.addEventListener('keydown', e=>{
      if(e.key!=='Escape' || pop.hidden) return;
      if(agePick){ agePick=null; apply(); return; }
      closePop();
    });

    window.syncGuestRooms = apply;   // let the room cart refresh the "N rooms" chip label
    window.userInParty = () => usedIds().has('you');   // is the account holder among the travellers?
    apply();
  }

  window.GuestPicker = { init };
})();
