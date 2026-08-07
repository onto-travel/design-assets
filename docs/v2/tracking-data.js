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
    tel: '+919019090190',
    link: function (text) {
      return 'https://wa.me/' + WA.digits + '?text=' + encodeURIComponent(text);
    },
    forward: function () {
      return WA.link("Hi onto — here's a hotel booking I'd like you to track.");
    },
    /* A property we don't sell is handled by a person, so the card hands the
       guest straight to one with the booking already named. */
    help: function (b) {
      return WA.link(
        'Hi onto — I need some help with my booking at ' +
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
        /* 3.9 — the rate behind the offer has its own life, shorter here than
           the cancellation window. The offer ends at whichever runs out first. */
        rate_expires_at: '2026-08-09T12:00:00+05:30',
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-07-14', 58900], ['2026-07-18', 58900], ['2026-07-22', 57400],
        ['2026-07-26', 56200], ['2026-07-30', 54800], ['2026-08-01', 53600],
        ['2026-08-03', 52900]
      ]
    },

    /* 2 — second like-for-like saving. Paired with #1 as the default account,
       so the list opens on two live offers rather than one.
       The cheaper-but-worse case is #14, which is where 3.6 is exercised. */
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
    },

    /* 13 — 3.5: more than one room. Nothing about the case is different except
       that both figures are sums, so the comparison has to be made on the whole
       booking and never on a nightly or per-room rate. */
    {
      id: 'bk-fishermans-cove',
      ownership: 'tracked',
      source_platform: 'makemytrip',
      property_id: 'prop-fishermans-cove',
      property_name_raw: "Taj Fisherman's Cove Resort & Spa, Chennai",
      location: 'Covelong Beach · Chennai',
      stars: 5,
      check_in: '2026-09-04', check_out: '2026-09-07',
      room_category: 'Deluxe Room Sea View',
      rooms: 2,
      occupancy: '2 rooms · 4 adults, 1 child',
      /* the child sleeps on an extra bed in the second room — a priced line on
         the voucher, so it is part of what has to match, not a footnote */
      extra_beds: 1,
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-09-02T18:00:00+05:30',
      price_paid_total: 96400,
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-07-30/mmt-conf-4417.pdf',
      parse_confidence: 0.93,
      created_at: '2026-07-30T16:20:00+05:30',
      last_checked_at: null,
      image: 'images/sv-01-bedroom.png',
      our_offer: {
        room_category: 'Deluxe Room Sea View',
        rooms: 2,
        occupancy: '2 rooms · 4 adults, 1 child',
        extra_beds: 1,
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-09-02T18:00:00+05:30',
        our_price_total: 88700,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-07-30', 95200], ['2026-08-02', 91400], ['2026-08-05', 88700]
      ]
    },

    /* 14 — 3.6: cheaper with us, and not the same room. We only switch an
       exact match, so this is never offered and never priced on screen. */
    {
      id: 'bk-udaivilas',
      ownership: 'tracked',
      source_platform: 'booking',
      property_id: 'prop-oberoi-udaivilas',
      property_name_raw: 'The Oberoi Udaivilas, Udaipur',
      location: 'Haridasji Ki Magri · Udaipur',
      stars: 5,
      check_in: '2026-10-16', check_out: '2026-10-19',
      room_category: 'Premier Room with Semi-Private Pool',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-10-14T18:00:00+05:30',
      price_paid_total: 74000,
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-07-31/bdc-conf-6034.pdf',
      parse_confidence: 0.95,
      created_at: '2026-07-31T09:40:00+05:30',
      last_checked_at: null,
      image: 'images/pv-02-living.png',
      our_offer: {
        /* a grade down: no pool on the room. Cheaper, and not the thing they
           chose — so the difference is the answer, not the price. */
        room_category: 'Premier Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-10-14T18:00:00+05:30',
        our_price_total: 69500,
        room_matched: false,
        availability: 'available'
      },
      observations: [
        ['2026-07-31', 70800], ['2026-08-04', 69500]
      ]
    },

    /* 15 — 3.7: non-refundable original. The saving is real, correct, and
       permanently out of reach — cancelling forfeits the whole of what they
       already paid, so switching would mean buying the same nights twice. */
    {
      id: 'bk-lake-palace',
      ownership: 'tracked',
      source_platform: 'agoda',
      property_id: 'prop-taj-lake-palace',
      property_name_raw: 'Taj Lake Palace, Udaipur',
      location: 'Pichola Lake · Udaipur',
      stars: 5,
      check_in: '2026-11-20', check_out: '2026-11-23',
      room_category: 'Luxury Room Lake View',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'non_refundable',
      free_cancellation_until: null,
      price_paid_total: 68000,
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-08-01/agoda-conf-8875.jpg',
      parse_confidence: 0.96,
      created_at: '2026-08-01T12:15:00+05:30',
      last_checked_at: null,
      image: 'images/pp-05-pool.png',
      our_offer: {
        room_category: 'Luxury Room Lake View',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-11-18T18:00:00+05:30',
        our_price_total: 61200,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-08-01', 64100], ['2026-08-04', 61200]
      ]
    },

    /* 16 — 3.8: paid in points. The voucher still states what the redemption
       cost in rupees, so there is a figure to compare and this is an ordinary
       offer. How they paid matters only when a refund has to find its way
       back; it is not something the price needs to explain. */
    {
      id: 'bk-jw-sahar',
      ownership: 'tracked',
      source_platform: 'makemytrip',
      property_id: 'prop-jw-sahar',
      property_name_raw: 'JW Marriott Mumbai Sahar',
      location: 'Andheri East · Mumbai',
      stars: 5,
      check_in: '2026-09-17', check_out: '2026-09-19',
      room_category: 'Deluxe Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-09-15T18:00:00+05:30',
      /* what the redemption cost, as the voucher states it. `paid_with` is
         carried for the refund path and is never rendered on the price. */
      price_paid_total: 28900,
      paid_with: 'points',
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-08-02/mmt-fwd-0114.pdf',
      parse_confidence: 0.89,
      created_at: '2026-08-02T21:05:00+05:30',
      last_checked_at: null,
      image: 'images/ls-02-living.png',
      our_offer: {
        room_category: 'Deluxe Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-09-15T18:00:00+05:30',
        our_price_total: 24800,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-08-02', 25600], ['2026-08-05', 24800]
      ]
    },

    /* 17 — 3.12: the free-cancellation window shut while we were watching.
       The stay is still ahead of them and stays on the list; it has simply
       stopped being something we can switch. */
    {
      id: 'bk-oberoi-delhi',
      ownership: 'tracked',
      source_platform: 'booking',
      property_id: 'prop-oberoi-delhi',
      property_name_raw: 'The Oberoi, New Delhi',
      location: 'Dr Zakir Hussain Marg · New Delhi',
      stars: 5,
      check_in: '2026-10-18', check_out: '2026-10-20',
      room_category: 'Deluxe Room City View',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      /* already behind us — today is 6 Aug 2026 */
      free_cancellation_until: '2026-08-01T18:00:00+05:30',
      price_paid_total: 39800,
      currency: 'INR',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-07-11/bdc-conf-4402.pdf',
      parse_confidence: 0.97,
      created_at: '2026-07-11T14:00:00+05:30',
      last_checked_at: null,
      image: 'images/pr-02-living.png',
      our_offer: {
        room_category: 'Deluxe Room City View',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-10-16T18:00:00+05:30',
        /* cheaper, and it stopped mattering on 1 August */
        our_price_total: 36100,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-07-11', 39600], ['2026-07-25', 37900], ['2026-08-05', 36100]
      ]
    },

    /* 18 — 3.13: charged in another currency. What left their account went
       through an exchange rate and a card margin we never see, so their figure
       is reproduced exactly as charged and never converted. */
    {
      id: 'bk-coromandel',
      ownership: 'tracked',
      source_platform: 'agoda',
      property_id: 'prop-taj-coromandel',
      property_name_raw: 'Taj Coromandel, Chennai',
      location: 'Nungambakkam · Chennai',
      stars: 5,
      check_in: '2026-09-28', check_out: '2026-10-01',
      room_category: 'Superior Charm Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-09-26T18:00:00+05:30',
      price_paid_total: 640,
      currency: 'USD',
      status: 'saving_available',
      raw_artifact_ref: 'wa/2026-08-04/agoda-conf-9921.pdf',
      parse_confidence: 0.92,
      created_at: '2026-08-04T07:30:00+05:30',
      last_checked_at: null,
      image: 'images/gv-01-bedroom.png',
      our_offer: {
        room_category: 'Superior Charm Room',
        occupancy: '2 adults',
        meal_plan: 'Breakfast included',
        cancellation_policy: 'free_until',
        free_cancellation_until: '2026-09-26T18:00:00+05:30',
        our_price_total: 48900,
        room_matched: true,
        availability: 'available'
      },
      observations: [
        ['2026-08-04', 50200], ['2026-08-05', 48900]
      ]
    }
  ];

  /* ---------- formatting ---------- */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* We sell in rupees. A voucher may be denominated in anything, and the card
     that paid it added a margin we cannot see — so a foreign figure is only
     ever reproduced, never converted. */
  var SYMBOL = { INR: '₹', USD: '$', GBP: '£', EUR: '€', AED: 'AED ', SGD: 'S$', THB: '฿' };

  var fmt = {
    inr: function (n) {
      if (n === null || n === undefined) return '—';
      return '₹' + Math.round(n).toLocaleString('en-IN');
    },
    /* A figure in the currency it was actually charged in. */
    money: function (n, cur) {
      if (n === null || n === undefined) return '—';
      if (!cur || cur === 'INR') return fmt.inr(n);
      return (SYMBOL[cur] || cur + ' ') + Math.round(n).toLocaleString('en-US');
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
                 label: 'Cancel old booking within ' + mtext, urgent: true };
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
        ? 'Cancel old booking within ' + h + (h === 1 ? ' hour' : ' hours')
        : 'Cancel old booking by ' + fmt.day(iso);
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

  /* Rooms, heads and extra beds are all priced lines on a voucher, so they are
     part of what has to match. Stated as one phrase because that is how the
     booking states it, and how anyone checks it. */
  function occupancyText(x) {
    var t = x.occupancy || '—';
    if (x.extra_beds) {
      t += ' · ' + x.extra_beds + (x.extra_beds === 1 ? ' extra bed' : ' extra beds');
    }
    return t;
  }

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
      } else if (a.key === 'occupancy') {
        theirs = occupancyText(b);
        ours = occupancyText(o);
        verdict = theirs === ours ? 'same' : 'differs';
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

    /* Two ways the arithmetic is simply unavailable, and they are not the same
       as "no saving". Points and vouchers leave no cash figure to beat, and a
       foreign charge went through an exchange rate and a card margin we never
       see. In both we know our own price and nothing about theirs, so we state
       ours and claim nothing — a delta invented from either would be a lie
       with a number on it. */
    var crossCurrency = (b.currency || 'INR') !== 'INR';
    var noCashPrice = b.price_paid_total === null || b.price_paid_total === undefined;
    var comparable = !crossCurrency && !noCashPrice;

    var delta = comparable ? b.price_paid_total - o.our_price_total : null;
    var worse = rows.filter(function (r) { return r.verdict === 'worse' || r.verdict === 'differs'; });
    var likeForLike = worse.length === 0;

    return {
      rows: rows,
      /* the room, board and terms still match even when the money cannot be
         put side by side — that is what makes the switch sellable at all */
      crossCurrency: crossCurrency,
      comparable: comparable,
      /* Every attribute matches or ours is better. Nothing is shown, compared,
         or offered unless this is true — we never ask someone to give up
         breakfast, a room grade or free cancellation to pay less. A cheaper
         rate that is worse on any attribute is not an option, it is not a
         saving, and it does not appear in the product at all. */
      likeForLike: likeForLike,
      /* A saving is only a saving when it is like-for-like, cheaper, and
         actually measurable against what they paid. */
      isSaving: comparable && likeForLike && delta > 0,
      /* Kept for internal reasoning; never rendered as an offer. */
      tradeoffs: worse,
      delta: delta,
      theirTotal: b.price_paid_total,
      ourTotal: o.our_price_total
    };
  }

  /* ---------- 03 Watch: which case a booking we are watching is in ----------
     One derived answer, resolved here rather than re-read from a scatter of
     fields by every screen. Two things come out of it: `kind`, which decides
     what we say, and `switchable`, which decides whether we offer anything at
     all. They are separate on purpose — a saving can be real, correct and
     completely unsellable, and the whole point of this stage is to tell those
     apart before a button gets drawn. */

  /* Free cancellation is the guest's ability to act. Once it lapses, a cheaper
     price is not an opportunity, it is only a source of regret. */
  function windowClosed(b) {
    if (b.cancellation_policy !== 'free_until' || !b.free_cancellation_until) return false;
    return new Date(b.free_cancellation_until) <= new Date();
  }

  function watch(b) {
    if (b.ownership !== 'tracked') return null;

    /* Not yet a watch: nothing has been confirmed to watch. Ingest owns this. */
    if (b.status === 'pending') return { kind: 'pending', ref: '1.4', switchable: false };
    /* A switch already happened on this stay — stage 04 owns what is left. */
    if (b.switch_event) return { kind: 'switched', ref: '4.1', switchable: false };

    /* 3.3 — we do not sell this property, so there is no price to watch. It is
       on the trip and it is not a failure that it is quiet. */
    if (!b.property_id) return { kind: 'not_carried', ref: '3.3', switchable: false };

    /* 3.12 — the window shut. The booking stays; it stops being switchable. */
    if (windowClosed(b)) {
      return { kind: 'window_closed', ref: '3.12', switchable: false,
               closedAt: b.free_cancellation_until };
    }

    /* 3.4 — we do sell it, and have nothing for these dates. Availability
       comes back, so this is a pause in the watch, not the end of it. */
    if (!b.our_offer || b.our_offer.availability !== 'available') {
      return { kind: 'sold_out', ref: '3.4', switchable: false };
    }

    var c = b.comparison;
    var ours = b.our_offer.our_price_total;
    var match = !!(c && c.likeForLike);

    /* 3.7 — non-refundable. Cancelling forfeits the whole original, so taking
       our price would mean paying for the same nights twice. The saving is
       arithmetically real and permanently out of reach. */
    if (b.cancellation_policy === 'non_refundable') {
      var beats = c && c.comparable && c.delta > 0;
      return { kind: beats ? 'unreachable' : 'level', ref: beats ? '3.7' : '3.2',
               switchable: false, ourTotal: ours, theirTotal: b.price_paid_total };
    }

    /* 3.13 — charged in another currency. Both figures go on the card as they
       stand, theirs in what it was charged in and ours in rupees. We do not
       convert between them: the exchange rate and the card margin behind their
       number are not ours to guess at, so we state and let them read. */
    if (c && c.crossCurrency) {
      return { kind: 'cross_currency', ref: '3.13', switchable: match, ourTotal: ours,
               theirTotal: b.price_paid_total, theirCurrency: b.currency };
    }

    /* 3.1 / 3.5 — the offer. 3.5 is the same case carrying more than one room:
       nothing changes except that the figures being compared are sums, which
       is `compare`'s business and not something the card restates. */
    if (c && c.isSaving) {
      return { kind: 'saving', ref: b.rooms > 1 ? '3.5' : '3.1', switchable: true,
               ourTotal: c.ourTotal, theirTotal: c.theirTotal };
    }

    /* 3.6 — cheaper, but not the same thing. We only ever switch an exact
       match, so this is not an offer and carries no number: against the room
       they actually booked, what they hold is still the best we have. */
    if (c && c.comparable && c.delta > 0) {
      return { kind: 'near_miss', ref: '3.6', switchable: false };
    }

    /* 3.2 — our price is higher, or level. The common case, and the one that
       decides whether being watched feels alive or dead. */
    if (c && c.comparable && c.delta < 0) {
      return { kind: 'dearer', ref: '3.2', switchable: false };
    }
    return { kind: 'level', ref: '3.2', switchable: false };
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
      b.watch = watch(b);
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

  /* Adapter to the shape booking-details.html reads from sessionStorage.
     Both ownerships pass through it now that the list opens every row on that
     page — but a tracked booking is someone else's paperwork, so it carries a
     `tracked` flag and no reference of ours, and the page drops the actions
     that only a booking we made can honour. */
  function toLegacy(b) {
    if (!b) return null;
    var tracked = b.ownership !== 'owned';
    /* A booking we made by switching leaves the original live on the other
       platform until the guest cancels it themselves. That task travels with
       our booking, because ours is the page they will actually open. */
    var old = (!tracked && b.switched_from) ? get(b.switched_from) : null;
    var owes = old && old.switch_event && !old.switch_event.user_marked_cancelled_at
      ? old.switch_event : null;
    return {
      cancelOld: owes ? {
        id: old.id,
        platform: old.platform ? old.platform.label : null,
        manage: old.platform ? old.platform.manage : null,
        deadline: fmt.countdown(owes.cancel_deadline).label,
        /* the two bookings that already exist, dated, so the details page can
           draw the sequence the guest is standing in the middle of */
        bookedOld: fmt.day(old.created_at),
        bookedOurs: fmt.day(b.created_at),
        /* the same deadline as `deadline`, shortened to sit under a timeline step */
        deadlineShort: (function () {
          var c = fmt.countdown(owes.cancel_deadline);
          if (c.expired) return 'Deadline passed';
          return c.urgent ? c.short + ' left' : 'by ' + fmt.day(owes.cancel_deadline);
        })(),
        expired: !!fmt.countdown(owes.cancel_deadline).expired
      } : null,
      id: b.id,
      tracked: tracked,
      /* "your original booking" only means something once there is a second
         booking to be original to — so the page needs to know a switch happened */
      switched: !!(b.counterpart || b.switched_from),
      platform: tracked && b.platform ? b.platform.label : null,
      /* the standing offer on a tracked stay: what they paid against what we
         would charge. Only when it is like-for-like and actually cheaper —
         `compare` has already made that judgement. */
      saving: tracked && b.comparison && b.comparison.isSaving ? {
        theirs: fmt.inr(b.comparison.theirTotal),
        ours: fmt.inr(b.comparison.ourTotal),
        /* the raw figure the switch is actually booked at */
        oursNum: b.comparison.ourTotal
      } : null,
      status: b.status === 'completed' ? 'completed' : 'upcoming',
      hotel: b.property_name_raw,
      place: b.location,
      dates: fmt.dateRange(b.check_in, b.check_out),
      nights: fmt.nights(b.check_in, b.check_out),
      guests: b.occupancy + ' · 1 room',
      room: b.room_category,
      amount: fmt.inr(b.price_paid_total),
      ref: b.booking_ref || null,
      img: b.image,
      paid: true,
      payMode: 'paid',
      /* the rate's own terms, so the booking page states them from the booking
         rather than from a constant that only happened to match one property */
      mealPlan: b.meal_plan || null,
      freeCancelUntil: b.cancellation_policy === 'free_until' && b.free_cancellation_until
        ? fmt.day(b.free_cancellation_until) : null,
      /* no per-property switchboard in the prototype — calls land on our line */
      phone: WA.tel
    };
  }

  var api = {
    WA: WA,
    fmt: fmt,
    all: all,
    get: get,
    sorted: sorted,
    compare: compare,
    cancellationText: cancellationText,
    occupancyText: occupancyText,
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
