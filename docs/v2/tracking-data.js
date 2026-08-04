/* tracking-data.js
   Mock data layer for the price-tracking surface (bookings booked elsewhere).
   No backend. The seed below is the "parsed" corpus; user actions persist to
   localStorage so the switch -> cancel-task flow survives a reload.

   Ownership is the axis the whole UI hangs off:
     'owned'   -> booked with us. Full management.
     'tracked' -> booked elsewhere. We watch the price. We can never cancel,
                  modify, or produce a voucher for it.
*/
(function (root) {
  'use strict';

  var NS = 'onto:tracking:v1';

  /* ---------- WhatsApp: ingestion + notification channel (out of scope to build) ---------- */
  var WA = {
    display: '+91 90190 90190',
    digits: '919019090190',
    link: function (text) {
      return 'https://wa.me/' + WA.digits + '?text=' + encodeURIComponent(text);
    },
    forward: function () {
      return WA.link("Hi onto — here's a hotel booking I'd like you to track.");
    },
    fix: function (b) {
      return WA.link(
        'Hi onto — something looks wrong on the booking you\'re tracking for me: ' +
        b.property_name_raw + ', ' + fmt.dateRange(b.check_in, b.check_out) + '.'
      );
    }
  };

  /* ---------- platforms ---------- */
  var PLATFORMS = {
    makemytrip: { label: 'MakeMyTrip', manage: 'https://www.makemytrip.com/my-account/' },
    booking:    { label: 'Booking.com', manage: 'https://secure.booking.com/mybooking.html' },
    agoda:      { label: 'Agoda', manage: 'https://www.agoda.com/account/bookings.html' }
  };

  /* ---------- seed bookings ----------
     Field names mirror the agreed Booking model exactly.
     free_cancellation_until is an absolute datetime with offset — vouchers state
     it relatively ("until 24 hours before check-in") and every reminder in the
     system hangs off resolving it once, here.
     raw_artifact_ref is retained permanently, including after a switch. */
  var SEED = [
    /* 1 — saving available, all four attributes match */
    {
      id: 'bk-taj-exotica',
      ownership: 'tracked',
      source_platform: 'makemytrip',
      property_id: 'prop-taj-exotica-goa',
      property_name_raw: 'Taj Exotica Resort & Spa, Goa',
      location: 'Benaulim Beach · Goa',
      stars: 5,
      check_in: '2026-08-14', check_out: '2026-08-17',
      room_category: 'Villa Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-08-12T18:00:00+05:30',
      price_paid_total: 58400,
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-07-14/mmt-conf-8841.jpg',
      parse_confidence: 0.97,
      created_at: '2026-07-14T09:22:00+05:30',
      last_checked_at: null,
      image: 'images/06-aerial-pool.png',
      our_offer: {
        room_category: 'Villa Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-08-12T18:00:00+05:30',
        our_price_total: 52900,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-07-14', 58900], ['2026-07-18', 58900], ['2026-07-22', 57400],
        ['2026-07-26', 56200], ['2026-07-30', 54800], ['2026-08-01', 53600],
        ['2026-08-03', 52900]
      ]
    },

    /* 2 — cheaper, but one attribute is worse. Never presented as a saving. */
    {
      id: 'bk-leela-jaipur',
      ownership: 'tracked',
      source_platform: 'booking',
      property_id: 'prop-leela-jaipur',
      property_name_raw: 'The Leela Palace Jaipur',
      location: 'Kukas · Jaipur',
      stars: 5,
      check_in: '2026-09-22', check_out: '2026-09-25',
      room_category: 'Grand Deluxe Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-09-20T18:00:00+05:30',
      price_paid_total: 47200,
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-07-19/bdc-conf-2290.pdf',
      parse_confidence: 0.94,
      created_at: '2026-07-19T18:40:00+05:30',
      last_checked_at: null,
      image: 'images/pp-01-exterior.png',
      our_offer: {
        room_category: 'Grand Deluxe Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-09-20T18:00:00+05:30',
        our_price_total: 43900,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-07-19', 46800], ['2026-07-24', 46100], ['2026-07-29', 44700],
        ['2026-08-03', 43900]
      ]
    },

    /* 3 — no saving, our price rose */
    {
      id: 'bk-vivanta-blr',
      ownership: 'tracked',
      source_platform: 'agoda',
      property_id: 'prop-vivanta-whitefield',
      property_name_raw: 'Vivanta Bengaluru, Whitefield',
      location: 'Whitefield · Bengaluru',
      stars: 5,
      check_in: '2026-09-09', check_out: '2026-09-11',
      room_category: 'Deluxe Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-09-07T18:00:00+05:30',
      price_paid_total: 18600,
      currency: 'INR',
      status: 'no_saving_up',
      raw_artifact_ref: 'wa/2026-07-15/agoda-conf-5512.jpg',
      parse_confidence: 0.96,
      created_at: '2026-07-15T11:05:00+05:30',
      last_checked_at: null,
      image: 'images/ls-01-bedroom.png',
      our_offer: {
        room_category: 'Deluxe Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-09-07T18:00:00+05:30',
        our_price_total: 20400,
        room_matched: true,
        availability: 'available'
      },
      rose_by: 1800,
      rose_since: '2026-07-21',
      observations: [
        ['2026-07-15', 18600], ['2026-07-21', 18600], ['2026-07-25', 19200],
        ['2026-07-30', 19900], ['2026-08-03', 20400]
      ]
    },

    /* 4 — no saving, price flat. The majority outcome. */
    {
      id: 'bk-westend-blr',
      ownership: 'tracked',
      source_platform: 'makemytrip',
      property_id: 'prop-taj-west-end',
      property_name_raw: 'Taj West End, Bengaluru',
      location: 'Race Course Road · Bengaluru',
      stars: 5,
      check_in: '2026-10-03', check_out: '2026-10-05',
      room_category: 'Luxury Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-10-01T18:00:00+05:30',
      price_paid_total: 31000,
      currency: 'INR',
      status: 'no_saving_flat',
      raw_artifact_ref: 'wa/2026-07-22/mmt-conf-9103.jpg',
      parse_confidence: 0.98,
      created_at: '2026-07-22T20:15:00+05:30',
      last_checked_at: null,
      image: 'images/pr-01-bedroom.png',
      our_offer: {
        room_category: 'Luxury Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-10-01T18:00:00+05:30',
        our_price_total: 31000,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-07-22', 31000], ['2026-07-26', 30900], ['2026-07-30', 31000],
        ['2026-08-03', 31000]
      ]
    },

    /* 5 — sold out with us for their dates */
    {
      id: 'bk-rambagh-jaipur',
      ownership: 'tracked',
      source_platform: 'booking',
      property_id: 'prop-rambagh-palace',
      property_name_raw: 'Rambagh Palace, Jaipur',
      location: 'Bhawani Singh Road · Jaipur',
      stars: 5,
      check_in: '2026-11-12', check_out: '2026-11-14',
      room_category: 'Palace Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-11-09T18:00:00+05:30',
      price_paid_total: 64000,
      currency: 'INR',
      status: 'sold_out',
      raw_artifact_ref: 'wa/2026-07-26/bdc-conf-7741.pdf',
      parse_confidence: 0.95,
      created_at: '2026-07-26T13:30:00+05:30',
      last_checked_at: null,
      image: 'images/pv-01-exterior.png',
      our_offer: {
        room_category: null, occupancy: null, meal_plan: null,
        cancellation_policy: null, free_cancellation_until: null,
        our_price_total: null, room_matched: false, availability: 'sold_out'
      },
      observations: [
        ['2026-07-26', 66500], ['2026-07-30', 65900], ['2026-08-01', null],
        ['2026-08-03', null]
      ]
    },

    /* 6 — property not in our inventory. property_id stays null; raw name kept. */
    {
      id: 'bk-olaulim-goa',
      ownership: 'tracked',
      source_platform: 'agoda',
      property_id: null,
      property_name_raw: 'Olaulim Backyards',
      location: 'Olaulim · Goa',
      stars: 3,
      check_in: '2026-08-28', check_out: '2026-08-30',
      room_category: 'Garden Cottage',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-08-26T12:00:00+05:30',
      price_paid_total: 9800,
      currency: 'INR',
      status: 'not_carried',
      raw_artifact_ref: 'wa/2026-07-28/agoda-conf-3390.jpg',
      parse_confidence: 0.91,
      created_at: '2026-07-28T08:50:00+05:30',
      last_checked_at: null,
      image: 'images/gv-04-exterior.png',
      our_offer: null,
      observations: []
    },

    /* 7 — parsed, awaiting confirmation. Low parse confidence. */
    {
      id: 'bk-alila-goa',
      ownership: 'tracked',
      source_platform: 'makemytrip',
      property_id: 'prop-alila-diwa',
      property_name_raw: 'Alila Diwa Goa',
      location: 'Majorda · Goa',
      stars: 5,
      check_in: '2026-12-05', check_out: '2026-12-08',
      room_category: 'Deluxe Room',
      occupancy: '2 adults',
      meal_plan: null,
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-12-03T18:00:00+05:30',
      price_paid_total: 27400,
      currency: 'INR',
      status: 'pending',
      raw_artifact_ref: 'wa/2026-08-03/mmt-fwd-0031.jpg',
      parse_confidence: 0.42,
      created_at: '2026-08-03T00:00:00+05:30',
      last_checked_at: null,
      image: 'images/js-01-bedroom.png',
      our_offer: null,
      observations: []
    },

    /* 8 — switched with us; the old booking is now an open cancel task */
    {
      id: 'bk-westin-goa',
      ownership: 'tracked',
      source_platform: 'makemytrip',
      property_id: 'prop-westin-goa',
      property_name_raw: 'The Westin Goa',
      location: 'Anjuna · Goa',
      stars: 5,
      check_in: '2026-08-19', check_out: '2026-08-22',
      room_category: 'Deluxe Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-08-09T18:00:00+05:30',
      price_paid_total: 52300,
      currency: 'INR',
      status: 'cancel_pending',
      raw_artifact_ref: 'wa/2026-07-16/mmt-conf-6620.jpg',
      parse_confidence: 0.97,
      created_at: '2026-07-16T15:10:00+05:30',
      last_checked_at: null,
      image: 'images/07-garden-view.png',
      our_offer: {
        room_category: 'Deluxe Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-08-17T18:00:00+05:30',
        our_price_total: 48100,
        room_matched: true,
        availability: 'available'
      },
      switch_event: {
        booking_id: 'bk-westin-goa',
        new_booking_id: 'bk-westin-goa-onto',
        alerted_price: 48100,
        booked_price: 48100,
        cancel_deadline: '2026-08-09T18:00:00+05:30',
        user_marked_cancelled_at: null,
        /* room for cancellation proof later — no proof UI in v1 */
        proof_ref: null,
        proof_verified_at: null
      },
      observations: [
        ['2026-07-16', 52000], ['2026-07-22', 50800], ['2026-07-28', 49200],
        ['2026-08-02', 48100]
      ]
    },

    /* 9 — the booking we created for that switch. Owned: full management. */
    {
      id: 'bk-westin-goa-onto',
      ownership: 'owned',
      source_platform: null,
      property_id: 'prop-westin-goa',
      property_name_raw: 'The Westin Goa',
      location: 'Anjuna · Goa',
      stars: 5,
      check_in: '2026-08-19', check_out: '2026-08-22',
      room_category: 'Deluxe Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-08-17T18:00:00+05:30',
      price_paid_total: 48100,
      currency: 'INR',
      status: 'confirmed',
      booking_ref: 'ONT-WG4K7P',
      raw_artifact_ref: null,
      parse_confidence: null,
      created_at: '2026-08-02T19:40:00+05:30',
      last_checked_at: null,
      image: 'images/07-garden-view.png',
      switched_from: 'bk-westin-goa'
    },

    /* 10 — plain owned booking, never tracked */
    {
      id: 'bk-itc-goa',
      ownership: 'owned',
      source_platform: null,
      property_id: 'prop-itc-grand-goa',
      property_name_raw: 'ITC Grand Goa Resort & Spa',
      location: 'Arossim Beach · Goa',
      stars: 5,
      check_in: '2026-11-02', check_out: '2026-11-05',
      room_category: 'Luxury Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-10-31T18:00:00+05:30',
      price_paid_total: 41700,
      currency: 'INR',
      status: 'confirmed',
      booking_ref: 'ONT-IG9M2T',
      raw_artifact_ref: null,
      parse_confidence: null,
      created_at: '2026-06-30T12:00:00+05:30',
      last_checked_at: null,
      image: 'images/04-pool-sunset.png'
    },

    /* 11 — past: switched with us and the old one was cancelled */
    {
      id: 'bk-hyatt-goa',
      ownership: 'tracked',
      source_platform: 'booking',
      property_id: 'prop-grand-hyatt-goa',
      property_name_raw: 'Grand Hyatt Goa',
      location: 'Bambolim · Goa',
      stars: 5,
      check_in: '2026-06-12', check_out: '2026-06-15',
      room_category: 'Grand Club King',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-06-09T18:00:00+05:30',
      price_paid_total: 58900,
      currency: 'INR',
      status: 'switched_cancelled',
      raw_artifact_ref: 'wa/2026-05-28/bdc-conf-1180.pdf',
      parse_confidence: 0.96,
      created_at: '2026-05-28T10:00:00+05:30',
      last_checked_at: null,
      image: 'images/05-pool-day.png',
      our_offer: {
        room_category: 'Grand Club King',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-06-10T18:00:00+05:30',
        our_price_total: 52200,
        room_matched: true,
        availability: 'available'
      },
      switch_event: {
        booking_id: 'bk-hyatt-goa',
        new_booking_id: 'bk-hyatt-goa-onto',
        new_booking_ref: 'ONT-GH2P8L',
        alerted_price: 52200,
        booked_price: 52200,
        cancel_deadline: '2026-06-09T18:00:00+05:30',
        user_marked_cancelled_at: '2026-06-01T09:12:00+05:30',
        proof_ref: null,
        proof_verified_at: null
      },
      observations: [
        ['2026-05-28', 58400], ['2026-05-31', 54900], ['2026-06-01', 52200]
      ]
    },

    /* 12 — the booking that switch produced. Past, owned. */
    {
      id: 'bk-hyatt-goa-onto',
      ownership: 'owned',
      source_platform: null,
      property_id: 'prop-grand-hyatt-goa',
      property_name_raw: 'Grand Hyatt Goa',
      location: 'Bambolim · Goa',
      stars: 5,
      check_in: '2026-06-12', check_out: '2026-06-15',
      room_category: 'Grand Club King',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-06-10T18:00:00+05:30',
      price_paid_total: 52200,
      currency: 'INR',
      status: 'completed',
      booking_ref: 'ONT-GH2P8L',
      raw_artifact_ref: null,
      parse_confidence: null,
      created_at: '2026-06-01T09:05:00+05:30',
      last_checked_at: null,
      image: 'images/05-pool-day.png',
      switched_from: 'bk-hyatt-goa'
    }
  ];

  /* ---------- formatting ---------- */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var fmt = {
    inr: function (n) {
      if (n === null || n === undefined) return '—';
      return '₹' + Math.round(n).toLocaleString('en-IN');
    },
    /* signed, for deltas */
    inrDelta: function (n) {
      return (n < 0 ? '−' : '') + fmt.inr(Math.abs(n));
    },
    day: function (iso) {
      var d = new Date(iso);
      return d.getDate() + ' ' + MONTHS[d.getMonth()];
    },
    dayYear: function (iso) {
      var d = new Date(iso);
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    },
    dateRange: function (a, b) {
      var da = new Date(a), db = new Date(b);
      var same = da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear();
      if (same) return da.getDate() + '–' + db.getDate() + ' ' + MONTHS[db.getMonth()] + ' ' + db.getFullYear();
      return fmt.day(a) + ' – ' + fmt.dayYear(b);
    },
    nights: function (a, b) {
      var n = Math.round((new Date(b) - new Date(a)) / 86400000);
      return n + (n === 1 ? ' night' : ' nights');
    },
    /* "9 Aug, 6:00 PM" */
    deadline: function (iso) {
      var d = new Date(iso);
      var h = d.getHours(), m = d.getMinutes();
      var ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
    },
    clock: function (d) {
      var h = d.getHours(), m = d.getMinutes();
      var ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
    },
    /* days + hours remaining, per the brief.
       `label` is the whole phrase a screen shows, and it changes shape at the
       one-day mark: a running count of days is not something anyone plans by,
       so until the last day this states the date they have to act by. Inside
       it, the hours are the point and the date no longer tells them anything. */
    countdown: function (iso) {
      var ms = new Date(iso) - new Date();
      if (ms <= 0) return { expired: true, text: 'Free cancellation has passed',
                            label: 'Free cancellation has passed' };
      var totalHours = Math.floor(ms / 3600000);
      /* Under an hour, hours floor to 0 and the countdown reads "0 hours left"
         at the exact moment it matters most. Drop to minutes instead. */
      if (totalHours === 0) {
        /* floored, never rounded: rounding 59m59s up prints "60 minutes left"
           of a window that has under an hour in it */
        var mins = Math.max(1, Math.floor(ms / 60000));
        var mtext = mins + (mins === 1 ? ' minute' : ' minutes');
        return { expired: false, days: 0, hours: 0, short: mtext, text: mtext + ' left',
                 label: 'Cancel within ' + mtext, urgent: true };
      }
      var d = Math.floor(totalHours / 24);
      var h = totalHours % 24;
      var parts = [];
      if (d) parts.push(d + (d === 1 ? ' day' : ' days'));
      parts.push(h + (h === 1 ? ' hour' : ' hours'));
      /* Hour-level precision is noise a week out and the whole point inside a
         day, so `short` drops the hours once there is more than a day to go. */
      var short = d >= 2 ? d + ' days'
        : d === 1 ? '1 day ' + h + (h === 1 ? ' hour' : ' hours')
        : h + (h === 1 ? ' hour' : ' hours');
      var urgent = d === 0;
      var label = urgent
        ? 'Cancel within ' + h + (h === 1 ? ' hour' : ' hours')
        : 'Cancel by ' + fmt.day(iso);
      return { expired: false, days: d, hours: h, short: short, urgent: urgent,
               text: parts.join(' ') + ' left', label: label };
    }
  };

  /* ---------- comparison: the four attributes ---------- */
  /* Order matters — this is the scan order on the compare screen. */
  var ATTRS = [
    { key: 'room_category', label: 'Room' },
    { key: 'occupancy',     label: 'Occupancy' },
    { key: 'meal_plan',     label: 'Meal plan' },
    { key: 'cancellation',  label: 'Cancellation' }
  ];

  /* Rank meal plans so we can tell "different" from "different and worse". */
  var MEAL_RANK = { 'Room only': 0, 'Breakfast included': 1, 'Breakfast and dinner': 2, 'All meals included': 3 };

  function cancellationText(policy, until) {
    if (policy === 'non_refundable') return 'Non-refundable';
    if (!until) return 'Free cancellation';
    return 'Free until ' + fmt.day(until);
  }

  /* Returns one row per attribute: their value, our value, and whether ours
     is same / different-but-equivalent / worse / better. */
  function compare(b) {
    var o = b.our_offer;
    if (!o || o.availability !== 'available') return null;

    var rows = ATTRS.map(function (a) {
      var theirs, ours, verdict;

      if (a.key === 'cancellation') {
        theirs = cancellationText(b.cancellation_policy, b.free_cancellation_until);
        ours = cancellationText(o.cancellation_policy, o.free_cancellation_until);
        if (b.cancellation_policy !== o.cancellation_policy) {
          verdict = o.cancellation_policy === 'non_refundable' ? 'worse' : 'better';
        } else if (theirs === ours) {
          verdict = 'same';
        } else {
          var td = new Date(b.free_cancellation_until), od = new Date(o.free_cancellation_until);
          verdict = od >= td ? 'better' : 'worse';
        }
      } else if (a.key === 'meal_plan') {
        theirs = b.meal_plan || '—';
        ours = o.meal_plan || '—';
        if (theirs === ours) verdict = 'same';
        else {
          var tr = MEAL_RANK[theirs], orr = MEAL_RANK[ours];
          verdict = (tr === undefined || orr === undefined) ? 'differs' : (orr > tr ? 'better' : 'worse');
        }
      } else {
        theirs = b[a.key] || '—';
        ours = o[a.key] || '—';
        verdict = theirs === ours ? 'same' : 'differs';
      }

      return { key: a.key, label: a.label, theirs: theirs, ours: ours, verdict: verdict };
    });

    var delta = b.price_paid_total - o.our_price_total;
    var worse = rows.filter(function (r) { return r.verdict === 'worse' || r.verdict === 'differs'; });
    var likeForLike = worse.length === 0;

    return {
      rows: rows,
      /* Every attribute matches or ours is better. Nothing is shown, compared,
         or offered unless this is true — we never ask someone to give up
         breakfast, a room grade or free cancellation to pay less. A cheaper
         rate that is worse on any attribute is not an option, it is not a
         saving, and it does not appear in the product at all. */
      likeForLike: likeForLike,
      /* A saving is only a saving when it is like-for-like and cheaper. */
      isSaving: likeForLike && delta > 0,
      /* Kept for internal reasoning; never rendered as an offer. */
      tradeoffs: worse,
      delta: delta,
      theirTotal: b.price_paid_total,
      ourTotal: o.our_price_total
    };
  }

  /* ---------- grouping: overlapping date ranges are one decision ----------
     A user holding three hotels for the same nights is deciding once, not three
     times. The v1 list renders flat, but the grouping lives in the model so it
     doesn't have to be retrofitted onto live bookings later. */
  function groups(list) {
    var items = list.slice().sort(function (a, b) {
      return new Date(a.check_in) - new Date(b.check_in);
    });
    var out = [], cur = null;
    items.forEach(function (b) {
      if (cur && new Date(b.check_in) < new Date(cur.check_out)) {
        cur.bookings.push(b);
        if (new Date(b.check_out) > new Date(cur.check_out)) cur.check_out = b.check_out;
      } else {
        cur = { id: 'grp-' + b.id, check_in: b.check_in, check_out: b.check_out, bookings: [b] };
        out.push(cur);
      }
    });
    out.forEach(function (g) {
      g.bookings.forEach(function (b) { b.group_id = g.id; g.size = g.bookings.length; });
    });
    return out;
  }

  /* ---------- persisted user actions ---------- */
  function readState() {
    try { return JSON.parse(localStorage.getItem(NS)) || {}; }
    catch (e) { return {}; }
  }
  function writeState(s) {
    try { localStorage.setItem(NS, JSON.stringify(s)); } catch (e) {}
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Seed + persisted overrides, with derived fields filled in. */
  function all() {
    var state = readState();
    var list = clone(SEED)
      .filter(function (b) { return (state.untracked || []).indexOf(b.id) === -1; })
      .concat(state.created || []);

    list.forEach(function (b) {
      var ov = (state.overrides || {})[b.id];
      if (ov) {
        Object.keys(ov).forEach(function (k) {
          if (k === 'switch_event' && b.switch_event) {
            Object.keys(ov[k]).forEach(function (kk) { b.switch_event[kk] = ov[k][kk]; });
          } else {
            b[k] = ov[k];
          }
        });
      }
      /* Prices move; the check timestamp is live so the compare screen can state it. */
      b.last_checked_at = new Date(Date.now() - 38 * 60000).toISOString();
      b.platform = b.source_platform ? PLATFORMS[b.source_platform] : null;
      b.comparison = b.ownership === 'tracked' ? compare(b) : null;
      b.nights = fmt.nights(b.check_in, b.check_out);
    });

    /* A switch produces two records for one stay: the original booked elsewhere
       and the one we made. They are the same hotel, same nights, same decision —
       so the list renders them as a single card. The tracked record is the spine
       (it carries the price history and the cancel task); the booking we made
       hangs off it as `counterpart` and is not listed separately. */
    var byId = {};
    list.forEach(function (b) { byId[b.id] = b; });
    list.forEach(function (b) {
      if (b.switched_from && byId[b.switched_from]) {
        byId[b.switched_from].counterpart = b;
        b.merged_into = b.switched_from;
      }
    });

    groups(list);
    return list;
  }

  function get(id) {
    return all().filter(function (b) { return b.id === id; })[0] || null;
  }

  function setOverride(id, patch) {
    var s = readState();
    s.overrides = s.overrides || {};
    s.overrides[id] = Object.assign({}, s.overrides[id], patch);
    writeState(s);
  }

  /* What the list shows by default: two tracked bookings, each with a
     like-for-like saving we would actually sell. An owned card appears as soon
     as either one is switched.
     Everything else in SEED is a status-state fixture — reachable at ?all=1 for
     design review, but not what an account actually looks like. */
  var DEFAULT_IDS = ['bk-taj-exotica', 'bk-leela-jaipur'];

  function showAll() {
    try { return new URLSearchParams(location.search).get('all') === '1'; }
    catch (e) { return false; }
  }

  /* Upcoming only, by check-in ascending. A stay that has already happened has
     nothing left to track and no decision attached to it, so it does not belong
     on this page — past bookings stay in the model for history elsewhere. */
  function sorted() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var everything = showAll();
    return all()
      .filter(function (b) { return new Date(b.check_out) >= today; })
      /* folded into the tracked card for the same stay */
      .filter(function (b) { return !b.merged_into; })
      .filter(function (b) { return everything || DEFAULT_IDS.indexOf(b.id) !== -1; })
      .sort(function (a, b) { return new Date(a.check_in) - new Date(b.check_in); });
  }

  /* Open cancel tasks. Drives the amber banner(s) on /bookings. More than one
     can be outstanding — a user can switch two stays before cancelling either. */
  function openCancelTasks() {
    /* Derived from the visible list, never from all() — a banner pointing at a
       row the user cannot see is worse than no banner. */
    return sorted().filter(function (b) {
      return b.status === 'cancel_pending' &&
             b.switch_event && !b.switch_event.user_marked_cancelled_at;
    }).sort(function (a, b) {
      return new Date(a.switch_event.cancel_deadline) - new Date(b.switch_event.cancel_deadline);
    });
  }

  /* Adapter to the shape booking-details.html already reads from sessionStorage,
     so voucher / manage actions land on the existing voucher page. Owned only —
     a tracked booking never produces a voucher. */
  function toLegacy(b) {
    if (!b || b.ownership !== 'owned') return null;
    return {
      status: b.status === 'completed' ? 'completed' : 'upcoming',
      hotel: b.property_name_raw,
      place: b.location,
      dates: fmt.dateRange(b.check_in, b.check_out),
      nights: fmt.nights(b.check_in, b.check_out),
      guests: b.occupancy + ' · 1 room',
      room: b.room_category,
      amount: fmt.inr(b.price_paid_total),
      ref: b.booking_ref,
      img: b.image,
      paid: true,
      payMode: 'paid'
    };
  }

  var api = {
    WA: WA,
    PLATFORMS: PLATFORMS,
    ATTRS: ATTRS,
    fmt: fmt,
    all: all,
    get: get,
    sorted: sorted,
    groups: function () { return groups(all()); },
    compare: compare,
    cancellationText: cancellationText,
    openCancelTasks: openCancelTasks,
    toLegacy: toLegacy,

    /* Hand a booking to the existing voucher page in the shape it reads. */
    openOwned: function (id) {
      var legacy = toLegacy(get(id));
      if (!legacy) return false;
      try { sessionStorage.setItem('booking', JSON.stringify(legacy)); } catch (e) {}
      return true;
    },

    /* Book with us. Creates the owned booking and turns the old one into a
       cancel task — it is never cancelled by us. */
    completeSwitch: function (id, bookedPrice) {
      var b = get(id);
      if (!b || !b.our_offer) return null;
      var s = readState();
      var newId = id + '-onto';
      var ref = 'ONT-' + Math.random().toString(36).slice(2, 8).toUpperCase();

      s.created = (s.created || []).filter(function (x) { return x.id !== newId; });
      s.created.push({
        id: newId,
        ownership: 'owned',
        source_platform: null,
        property_id: b.property_id,
        property_name_raw: b.property_name_raw,
        location: b.location,
        check_in: b.check_in, check_out: b.check_out,
        room_category: b.our_offer.room_category,
        occupancy: b.our_offer.occupancy,
        meal_plan: b.our_offer.meal_plan,
        cancellation_policy: b.our_offer.cancellation_policy,
        free_cancellation_until: b.our_offer.free_cancellation_until,
        price_paid_total: bookedPrice,
        currency: 'INR',
        status: 'confirmed',
        booking_ref: ref,
        raw_artifact_ref: null,
        parse_confidence: null,
        created_at: new Date().toISOString(),
        image: b.image,
        switched_from: id
      });

      setOverrideOn(s, id, {
        status: 'cancel_pending',
        switch_event: {
          booking_id: id,
          new_booking_id: newId,
          new_booking_ref: ref,
          alerted_price: b.our_offer.our_price_total,
          booked_price: bookedPrice,
          cancel_deadline: b.free_cancellation_until,
          user_marked_cancelled_at: null,
          proof_ref: null,
          proof_verified_at: null
        }
      });
      writeState(s);
      return newId;
    },

    /* Taken on the user's word alone. No proof, no verification — nothing is
       owed to us, so verification buys nothing and costs conversion. */
    markCancelled: function (id) {
      var b = get(id);
      if (!b) return;
      var se = Object.assign({}, b.switch_event, { user_marked_cancelled_at: new Date().toISOString() });
      setOverride(id, { status: 'switched_cancelled', switch_event: se });
    },

    /* The mark is taken on their word, so it has to be as cheap to take back.
       Nothing else changed when it was set: the stay is already ours either
       way, only the outstanding cancellation task moves. */
    undoCancelled: function (id) {
      var b = get(id);
      if (!b) return;
      var se = Object.assign({}, b.switch_event, { user_marked_cancelled_at: null });
      setOverride(id, { status: 'cancel_pending', switch_event: se });
    },

    stopTracking: function (id) {
      var s = readState();
      s.untracked = (s.untracked || []).concat([id]);
      writeState(s);
    },

    reset: function () { try { localStorage.removeItem(NS); } catch (e) {} }
  };

  function setOverrideOn(s, id, patch) {
    s.overrides = s.overrides || {};
    s.overrides[id] = Object.assign({}, s.overrides[id], patch);
  }

  root.Tracking = api;
})(window);
