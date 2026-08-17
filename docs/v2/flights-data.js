/* flights-data.js
   The airport list and the flight model, shared by flights.html (the search
   entry, which needs the airports for its two autocompletes) and
   flight-results.html (which needs both).

   There is no backend here, and a prototype that reshuffles its results every
   time you reload is a prototype nobody can review. So a leg is *derived*, not
   random: everything is seeded off the route and the date, which means the
   05:55 IndiGo to Goa is the same 05:55 IndiGo to Goa on every load, on every
   machine, for as long as the route and date are the same. Change the date and
   the schedule changes with it, which is the behaviour you want when you are
   clicking around a calendar.

   Times are minutes-past-midnight local, kept as numbers until something needs
   to print them. Prices are whole rupees.
*/
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* AIRPORTS                                                            */
  /* ------------------------------------------------------------------ */
  /* The domestic set is the prototype's own map — the stays live in Goa,
     Udaipur, Rishikesh (Dehradun), Coorg (Mangaluru) and Alibaug (Pune/Mumbai),
     so those are reachable — plus the metros anyone would type first. The short
     international tail is there so the field doesn't feel walled in. */
  var AIRPORTS = [
    { code: 'DEL', city: 'Delhi',              name: 'Indira Gandhi International',            country: 'India',        lat: 28.5562, lon: 77.1000 },
    { code: 'BOM', city: 'Mumbai',             name: 'Chhatrapati Shivaji Maharaj International', country: 'India',     lat: 19.0896, lon: 72.8656 },
    { code: 'GOX', city: 'Goa',                name: 'Manohar International, Mopa',            country: 'India',        lat: 15.7414, lon: 73.8583 },
    { code: 'GOI', city: 'Goa',                name: 'Dabolim',                                country: 'India',        lat: 15.3808, lon: 73.8314 },
    { code: 'BLR', city: 'Bengaluru',          name: 'Kempegowda International',               country: 'India',        lat: 13.1986, lon: 77.7066 },
    { code: 'MAA', city: 'Chennai',            name: 'Chennai International',                  country: 'India',        lat: 12.9941, lon: 80.1709 },
    { code: 'HYD', city: 'Hyderabad',          name: 'Rajiv Gandhi International',             country: 'India',        lat: 17.2403, lon: 78.4294 },
    { code: 'CCU', city: 'Kolkata',            name: 'Netaji Subhas Chandra Bose International', country: 'India',      lat: 22.6547, lon: 88.4467 },
    { code: 'PNQ', city: 'Pune',               name: 'Pune',                                   country: 'India',        lat: 18.5822, lon: 73.9197 },
    { code: 'AMD', city: 'Ahmedabad',          name: 'Sardar Vallabhbhai Patel International', country: 'India',        lat: 23.0772, lon: 72.6347 },
    { code: 'UDR', city: 'Udaipur',            name: 'Maharana Pratap',                        country: 'India',        lat: 24.6177, lon: 73.8961 },
    { code: 'JAI', city: 'Jaipur',             name: 'Jaipur International',                   country: 'India',        lat: 26.8242, lon: 75.8122 },
    { code: 'COK', city: 'Kochi',              name: 'Cochin International',                   country: 'India',        lat: 10.1520, lon: 76.4019 },
    { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International',               country: 'India',        lat:  8.4821, lon: 76.9201 },
    { code: 'IXE', city: 'Mangaluru',          name: 'Mangaluru International',                country: 'India',        lat: 12.9613, lon: 74.8901 },
    { code: 'DED', city: 'Dehradun',           name: 'Jolly Grant',                            country: 'India',        lat: 30.1897, lon: 78.1803 },
    { code: 'IXC', city: 'Chandigarh',         name: 'Chandigarh International',               country: 'India',        lat: 30.6735, lon: 76.7885 },
    { code: 'LKO', city: 'Lucknow',            name: 'Chaudhary Charan Singh International',   country: 'India',        lat: 26.7606, lon: 80.8893 },
    { code: 'MLE', city: 'Malé',               name: 'Velana International',                   country: 'Maldives',     lat:  4.1918, lon: 73.5291 },
    { code: 'DXB', city: 'Dubai',              name: 'Dubai International',                    country: 'UAE',          lat: 25.2532, lon: 55.3657 },
    { code: 'SIN', city: 'Singapore',          name: 'Changi',                                 country: 'Singapore',    lat:  1.3644, lon: 103.9915 },
    { code: 'BKK', city: 'Bangkok',            name: 'Suvarnabhumi',                           country: 'Thailand',     lat: 13.6900, lon: 100.7501 },
    { code: 'CMB', city: 'Colombo',            name: 'Bandaranaike International',             country: 'Sri Lanka',    lat:  7.1808, lon: 79.8841 },
    { code: 'LHR', city: 'London',             name: 'Heathrow',                               country: 'United Kingdom', lat: 51.4700, lon: -0.4543 }
  ];

  var BY_CODE = {};
  AIRPORTS.forEach(function (a) { BY_CODE[a.code] = a; });

  /* ------------------------------------------------------------------ */
  /* CARRIERS                                                            */
  /* ------------------------------------------------------------------ */
  /* The prototype is set in 2026, by which point Vistara has been folded into
     Air India — so it isn't here. `w` is the share of the schedule each airline
     gets; `f` scales its fares against the route's base. */
  /* `long` marks a carrier that can actually operate a widebody sector — it is
     what keeps a 737 off Mumbai–London. `longFleet` is what it puts on one. */
  var CARRIERS = [
    { code: '6E', name: 'IndiGo',            color: '#0b2265', w: 4.0, f: 1.00, long: false, fleet: ['A320neo', 'A321neo', 'A320neo'] },
    { code: 'AI', name: 'Air India',         color: '#b4172d', w: 2.0, f: 1.14, long: true,  fleet: ['A320neo', 'A321neo'], longFleet: ['787-8', '777-300ER', 'A350-900'] },
    { code: 'QP', name: 'Akasa Air',         color: '#eb6e1f', w: 2.0, f: 0.97, long: false, fleet: ['737 MAX 8'] },
    { code: 'SG', name: 'SpiceJet',          color: '#d81b60', w: 1.5, f: 0.91, long: false, fleet: ['737-800', 'Q400'] },
    { code: 'IX', name: 'Air India Express', color: '#f5a300', w: 1.5, f: 0.89, long: false, fleet: ['737-8'] }
  ];

  /* Foreign carriers only appear when a leg actually leaves the country. */
  var FOREIGN = {
    DXB: { code: 'EK', name: 'Emirates',          color: '#d71921', w: 2.5, f: 1.22, long: true, fleet: ['777-300ER', 'A380-800'], longFleet: ['777-300ER', 'A380-800'] },
    SIN: { code: 'SQ', name: 'Singapore Airlines', color: '#f5a623', w: 2.5, f: 1.28, long: true, fleet: ['787-10', 'A350-900'],   longFleet: ['787-10', 'A350-900'] },
    BKK: { code: 'TG', name: 'Thai Airways',      color: '#5b2b82', w: 2.0, f: 1.16, long: true, fleet: ['787-8', 'A350-900'],    longFleet: ['787-8', 'A350-900'] },
    CMB: { code: 'UL', name: 'SriLankan',         color: '#1c3f94', w: 2.0, f: 1.05, long: true, fleet: ['A320neo', 'A330-300'],  longFleet: ['A330-300'] },
    LHR: { code: 'BA', name: 'British Airways',   color: '#075aaa', w: 2.0, f: 1.30, long: true, fleet: ['787-9', '777-300ER'],   longFleet: ['787-9', '777-300ER'] },
    MLE: { code: 'Q2', name: 'Maldivian',         color: '#00a9a5', w: 1.2, f: 1.08, long: false, fleet: ['A320neo'] }
  };

  /* Past this, a sector needs a widebody and the narrowbody operators drop out
     of the pool entirely. */
  var LONGHAUL_KM = 3800;

  /* Regional turboprops fly regional sectors. Without this a Q400 turns up on
     Mumbai–Dubai, which is the sort of detail that costs a prototype its
     credibility in the first ten seconds. */
  var TYPE_MAX_KM = { 'Q400': 700, 'ATR 72': 700 };

  /* Where a one-stop itinerary is allowed to connect. */
  var HUBS = ['BOM', 'DEL', 'BLR', 'HYD'];

  /* ------------------------------------------------------------------ */
  /* SEEDED RANDOMNESS                                                   */
  /* ------------------------------------------------------------------ */
  function hash(s) {
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  /* mulberry32 — small, fast, and good enough that consecutive draws off one
     seed don't visibly correlate, which matters when one seed fills a whole
     day's schedule. */
  function rngFrom(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------ */
  /* GEOMETRY → BLOCK TIME                                               */
  /* ------------------------------------------------------------------ */
  function distanceKm(a, b) {
    if (!a || !b) return 900;
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    var la1 = a.lat * rad, la2 = b.lat * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(la1) * Math.cos(la2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  /* Gate to gate, not wheels to wheels: ~35 min of taxi, climb and descent on
     top of the cruise, which is what makes a 550km hop read as 1h 25m rather
     than 45 minutes. */
  function blockMinutes(km) {
    return Math.max(50, Math.round((35 + (km / 780) * 60) / 5) * 5);
  }

  /* ------------------------------------------------------------------ */
  /* THE SCHEDULE                                                        */
  /* ------------------------------------------------------------------ */
  var CABIN_MULT = { economy: 1, premium: 1.8, business: 3.3, first: 5.6 };

  function pickCarrier(pool, r) {
    var total = pool.reduce(function (n, c) { return n + c.w; }, 0);
    var x = r() * total;
    for (var i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  /* Fares move with the clock the way real ones do: the 6am and the 7pm bank
     are what business travellers want and cost accordingly, and the thing
     leaving at 22:40 is cheap because of when it lands. */
  function timeFactor(depMin) {
    var h = depMin / 60;
    if (h < 6)  return 0.90;
    if (h < 9)  return 1.07;
    if (h < 16) return 0.95;
    if (h < 21) return 1.10;
    return 0.86;
  }

  function carrierPool(from, to, km) {
    var pool = CARRIERS.slice();
    [from, to].forEach(function (code) {
      var f = FOREIGN[code];
      if (f && pool.indexOf(f) < 0) pool.push(f);
    });
    if (km > LONGHAUL_KM) {
      var long = pool.filter(function (c) { return c.long; });
      if (long.length) pool = long;
    }
    return pool;
  }

  /* One leg: every itinerary from `from` to `to` departing on `dateKey`
     ("2026-07-11"). Cabin only scales the fares — the schedule is the schedule. */
  function leg(from, to, dateKey, cabin) {
    var A = BY_CODE[from], B = BY_CODE[to];
    if (!A || !B || from === to) return [];

    var km = distanceKm(A, B);
    var r = rngFrom(hash(from + '>' + to + '@' + (dateKey || '')));
    var mult = CABIN_MULT[cabin] || 1;
    var base = 1250 + km * 3.15;

    var out = [];
    var used = {};

    /* --- nonstops --- */
    /* A trunk route gets a flight most of the day; a thin one gets three. */
    var nNon = km < 2200 ? 7 + Math.floor(r() * 5) : 3 + Math.floor(r() * 3);
    var slot = (int(22.5 * 60) - int(5.25 * 60)) / nNon;
    for (var i = 0; i < nNon; i++) {
      var dep = Math.round((int(5.25 * 60) + slot * i + r() * slot * 0.8) / 5) * 5;
      var dur = blockMinutes(km) + Math.round((r() * 20 - 5) / 5) * 5;
      out.push(build(r, used, from, to, dep, dur, 0, null, 0, 0, km, base, mult));
    }

    /* --- one-stops --- */
    /* Only worth showing where a connection is plausible: nobody connects to
       get from Mumbai to Pune. The via has to be a hub that isn't an endpoint,
       and it has to be roughly on the way — routing Mumbai→London through
       Bangalore is a detour a real schedule would never sell. */
    if (km > 700) {
      /* Two tests, because neither alone is enough. The ratio keeps short
         domestic connections honest; the absolute cap is what stops a modest
         *percentage* detour on a 7,000km sector from being a thousand-odd
         kilometres of flying the wrong way. At 800km the pair admits Delhi as
         the connection for Mumbai–London and rejects Hyderabad and Bangalore,
         while still allowing Hyderabad for Delhi–Goa, which is a connection
         that genuinely gets sold. */
      var vias = HUBS.filter(function (h) {
        if (h === from || h === to) return false;
        var V = BY_CODE[h];
        var viaKm = distanceKm(A, V) + distanceKm(V, B);
        return viaKm < km * 1.35 && (viaKm - km) < 800;
      });
      var nOne = km > 1400 ? 3 + Math.floor(r() * 3) : 1 + Math.floor(r() * 2);
      for (var j = 0; j < nOne && vias.length; j++) {
        var via = vias[Math.floor(r() * vias.length) % vias.length];
        var V2 = BY_CODE[via];
        var legA = blockMinutes(distanceKm(A, V2));
        var legB = blockMinutes(distanceKm(V2, B));
        var layover = 45 + Math.round(r() * 24) * 5;          // 45m — 2h 45m
        var dep2 = Math.round((int(5.5 * 60) + r() * (int(19 * 60) - int(5.5 * 60))) / 5) * 5;
        /* The aircraft is chosen off the longer of the two sectors — that's
           what decides whether this is a narrowbody job. */
        out.push(build(r, used, from, to, dep2, legA + layover + legB, 1, via, layover,
                       legA, Math.max(distanceKm(A, V2), distanceKm(V2, B)), base, mult));
      }
    }

    out.sort(function (a, b) { return a.depMin - b.depMin; });
    return out;
  }

  function int(n) { return Math.round(n); }

  function build(r, used, from, to, depMin, durMin, stops, via, layoverMin, legAMin, sectorKm, base, mult) {
    /* The pool is derived per itinerary from its own longest sector, not from
       the route's direct distance. They are not the same number: a connection
       can fly a sector longer than the nonstop it replaces, and picking the
       pool off the direct distance is how a 737 ends up on Goa–Singapore. */
    var c = pickCarrier(carrierPool(from, to, sectorKm), r);
    var fleet = (sectorKm > LONGHAUL_KM && c.longFleet) ? c.longFleet : c.fleet;
    var fit = fleet.filter(function (t) { return !TYPE_MAX_KM[t] || sectorKm <= TYPE_MAX_KM[t]; });
    if (fit.length) fleet = fit;

    /* Flight numbers are unique within a leg — two 6E 6114s in one list is the
       kind of thing a reviewer spots immediately. */
    var num;
    do { num = 100 + Math.floor(r() * 6800); } while (used[c.code + num]);
    used[c.code + num] = 1;

    /* A connection is worth less than the nonstop that beats it, and the
       market prices it that way. */
    var price = base * c.f * timeFactor(depMin) * (stops ? 0.84 : 1) * (0.94 + r() * 0.13) * mult;

    return {
      id: c.code + num + '-' + depMin,
      carrier: { code: c.code, name: c.name, color: c.color },
      number: c.code + ' ' + num,
      aircraft: fleet[Math.floor(r() * fleet.length)],
      from: from,
      to: to,
      depMin: depMin,
      arrMin: depMin + durMin,          // may run past 1440 — that's a next-day arrival
      durMin: durMin,
      stops: stops,
      via: via,
      layoverMin: layoverMin,
      legAMin: legAMin,                 // first sector, so a card can place the stop

      price: Math.round(price / 10) * 10
    };
  }

  /* ------------------------------------------------------------------ */
  /* FORMATTING                                                          */
  /* ------------------------------------------------------------------ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Minutes past midnight → "06:15", wrapping past midnight rather than
     printing "26:40". */
  function hhmm(min) {
    var m = ((min % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  }
  /* How many calendar days after departure an arrival lands — drives the
     "+1" a reader needs to see on a red-eye. */
  function dayOffset(min) { return Math.floor(min / 1440); }

  /* "2h 40m", "1h", "45m" — a sub-hour sector reads as minutes, not "0h 45m". */
  function dur(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + 'm';
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }

  /* Indian digit grouping — 1,24,500 rather than 124,500. */
  function inr(n) {
    var s = String(Math.round(n)), last = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last = ',' + last;
    return '₹' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last;
  }

  function stopsLabel(f) {
    return f.stops === 0 ? 'Nonstop' : f.stops + ' stop' + (f.stops > 1 ? 's' : '') + (f.via ? ' · ' + f.via : '');
  }

  /* A one-stop is two flown sectors with ground time in the middle, and the
     itinerary carries enough to say so exactly: the first sector's block time,
     the layover, and the total. The second sector is whatever is left. Every
     screen that draws a timeline needs this, so it is derived here once rather
     than re-derived per page — the arithmetic has to agree everywhere or the
     same flight arrives at two different times on two screens. */
  function sectors(f) {
    if (!f.stops || !f.via) return [{ from: f.from, to: f.to, dep: f.depMin, arr: f.arrMin }];
    var a = { from: f.from, to: f.via, dep: f.depMin, arr: f.depMin + f.legAMin };
    var b = { from: f.via, to: f.to, dep: a.arr + f.layoverMin, arr: f.arrMin };
    return [a, b];
  }

  /* What a fare is made of. The list quotes one number per traveller and every
     screen downstream has to total to exactly that — a checkout that discovers
     taxes the results page never mentioned is the oldest bad trick in travel.
     So the split is presentational: the fare is carved into base and tax, never
     topped up with one, and base + tax === price by construction. */
  var TAX_SHARE = 0.17;
  function fareSplit(price) {
    var tax = Math.round(price * TAX_SHARE / 10) * 10;
    return { base: price - tax, tax: tax };
  }

  root.Flights = {
    AIRPORTS: AIRPORTS,
    byCode: function (c) { return BY_CODE[c] || null; },
    /* Type-ahead over code, city, airport name and country, ranked so that
       typing "goa" puts Goa's airports above anything that merely mentions it,
       and typing a code puts that airport first. */
    search: function (q, limit) {
      var s = String(q || '').trim().toLowerCase();
      if (!s) return AIRPORTS.slice(0, limit || 8);
      var scored = [];
      AIRPORTS.forEach(function (a) {
        var code = a.code.toLowerCase(), city = a.city.toLowerCase();
        var name = a.name.toLowerCase(), ctry = a.country.toLowerCase();
        var rank = -1;
        if (code === s) rank = 0;
        else if (city === s) rank = 1;
        else if (city.indexOf(s) === 0) rank = 2;
        else if (code.indexOf(s) === 0) rank = 3;
        else if (name.toLowerCase().indexOf(s) === 0) rank = 4;
        else if (city.indexOf(s) > 0 || name.indexOf(s) > 0) rank = 5;
        else if (ctry.indexOf(s) === 0) rank = 6;
        if (rank >= 0) scored.push({ a: a, rank: rank });
      });
      scored.sort(function (x, y) { return x.rank - y.rank || x.a.city.localeCompare(y.a.city); });
      return scored.slice(0, limit || 8).map(function (x) { return x.a; });
    },
    leg: leg,
    distanceKm: function (a, b) { return distanceKm(BY_CODE[a], BY_CODE[b]); },
    hhmm: hhmm,
    dayOffset: dayOffset,
    dur: dur,
    inr: inr,
    stopsLabel: stopsLabel,
    sectors: sectors,
    fareSplit: fareSplit,

    /* What every screen says about what the fare includes and what changing
       your mind costs. One list, because the results card, the checkout and
       the ticket all quote it and they cannot disagree. */
    RULES: {
      cabinKg: 7,
      checkinKg: 15,
      changeFee: 3000,
      cancelFee: 3500
    }
  };
})(window);
