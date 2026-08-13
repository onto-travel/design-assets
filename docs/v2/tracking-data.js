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


    /* 5 — sold out with us for their dates. Dropped from the seed: on a list
       that no longer prints prices it renders exactly as 2 and 8 do — one line
       saying the booking is being watched — so it was a third identical card
       for a distinction only the model can see. `watch` still answers for the
       state; nothing in this account happens to be in it. */

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

    /* 14 — 3.6: cheaper with us, and not the same room. Dropped from the seed
       for the same reason as 5: with no prices on the list it reads as another
       "watching your booking", and one card already says that. */

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

    /* 16 — 3.8: paid in points. Dropped from the seed: how they paid is never
       rendered on the price, so on the list it was a third card carrying a
       "Book at" button and nothing the other two don't already show. Two live
       offers is enough to see how a list of them reads. */

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

  /* ---------- 1.x INGEST: what a handed-over voucher reads as ----------
     The guest gives us a document, not a form. A read either came back or it
     didn't, and `parsed` is the whole of that: there is no third state where
     we show four lines of seven and ask them to make up the difference. Either
     we have a booking to put in front of them or we have a document and a
     person to hand it to.

     The prototype reads nothing out of the actual file, so uploads take these
     in turn — the second voucher is the one that came out of a photograph. */
  var INBOX = [
    {
      parsed: true,
      source_platform: 'booking',
      property_id: 'prop-leela-udaipur',
      property_name_raw: 'The Leela Palace Udaipur',
      location: 'City Palace Road · Udaipur',
      stars: 5,
      check_in: '2026-10-09', check_out: '2026-10-12',
      room_category: 'Grand Heritage Room',
      occupancy: '2 adults',
      meal_plan: 'Breakfast included',
      cancellation_policy: 'free_until',
      free_cancellation_until: '2026-10-07T18:00:00+05:30',
      price_paid_total: 74600,
      currency: 'INR',
      parse_confidence: 0.96,
      image: 'images/pp-01-exterior.png',
      /* what the watch will find once it runs. Held here rather than on the
         booking because until they confirm the read, there is no booking. */
      our_price_total: 68900,
      settles_to: 'saving_available'
    },
    {
      /* Photographed off a screen at an angle, in the dark. Something came back
         off it, and not enough of it to be a booking: a name we are half sure
         of and one of two dates is not a stay we can watch, and putting it up
         as though it were would only move our problem onto them. There is a
         document, and there is nobody but a person who can read it. */
      parsed: false,
      parse_confidence: 0.18
    }
  ];

  /* Everything a read has to state, in the order it is checked against the
     paper it came off. It is read out and never typed back in: the upload
     exists so that nobody has to retype a booking they have already made, and
     a card of prefilled inputs would have handed that job straight back. What
     the guest is asked for is a yes or a no. A no goes to a person — they can
     see the document, we cannot, and they can fix it in one message where the
     guest would have had to find and correct the line themselves.

     `kind` is only how a value is read off the draft: three of these are not
     one plain field. Nothing here is ever half-filled — a read that could not
     produce all of them did not produce a booking, and never gets this far. */
  var VOUCHER_FIELDS = [
    { key: 'property_name_raw', label: 'Hotel', kind: 'text', head: true },
    { key: 'dates',             label: 'Dates', kind: 'dates' },
    { key: 'room_category',     label: 'Room', kind: 'text' },
    { key: 'occupancy',         label: 'Guests', kind: 'text' },
    { key: 'meal_plan',         label: 'Meal plan', kind: 'text' },
    { key: 'price_paid_total',  label: 'Paid', kind: 'money' },
    { key: 'source_platform',   label: 'Booked on', kind: 'platform' }
  ];

  /* A confirmed read is not yet a watch: the property has to be found in our
     inventory and priced for those dates, and that takes a moment we do not
     have a backend to spend. The booking lands as 'pending' and comes out of it
     on its own — resolved here off a timestamp rather than by a timer, so a
     reload in the middle of it doesn't strand the row on "checking" forever. */
  var SETTLE_MS = 6000;

  /* ---------- the mailbox ----------
     The other way a booking gets in. Every one of them was confirmed by email,
     so the guest granting read access once does the job the upload card does a
     document at a time.

     Nothing here reads mail. What the model has to hold is the only part the
     product owns: whether they said yes, and which mailbox they said it for.
     The consent itself belongs to Google and happens on Google's page — this
     side of it is a flag and an address. */
  var MAILBOX = 'xyz@email.com';

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

    /* 3.12 — the window shut. The booking stays; it stops being switchable.
       The figures go with it where we have them: the guest is owed the same two
       numbers as anyone else, and a gap that has moved out of reach is a thing
       to be told rather than one to be spared. Availability is not checked
       first here — the window closing outranks it — so there may be no price of
       ours to state, and then there simply isn't one. */
    if (windowClosed(b)) {
      var open = b.our_offer && b.our_offer.availability === 'available'
        ? b.our_offer.our_price_total : null;
      return { kind: 'window_closed', ref: '3.12', switchable: false,
               closedAt: b.free_cancellation_until,
               ourTotal: open,
               theirTotal: open == null ? null : b.price_paid_total };
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
      /* A booking that came in off a voucher leaves 'pending' when its first
         check would have come back. Derived, never written: the record keeps
         saying pending until the clock says otherwise, so this is true on the
         first render after it lands and on every reload after that. */
      if (b.settle_at && b.status === 'pending' &&
          new Date(b.settle_at) <= new Date()) {
        b.status = b.settled_status;
      }
      /* Prices move; the check timestamp is live so the compare screen can state it. */
      b.last_checked_at = new Date(Date.now() - 38 * 60000).toISOString();
      b.platform = b.source_platform ? PLATFORMS[b.source_platform] : null;
      b.comparison = b.ownership === 'tracked' ? compare(b) : null;
      b.watch = watch(b);
      b.nights = fmt.nights(b.check_in, b.check_out);
    });

    /* A switch produces two records for one stay: the original booked elsewhere
       and the one we made. They stay two records and they stay two cards. Same
       hotel and same nights, but they are held by two companies on two systems,
       and only one of them can be cancelled — by the guest, on the other site.
       Folding them into one card put a single row where the guest has two live
       bookings, which is the one thing the list must not say. It goes on saying
       two after the original is released, too: a cancellation is a thing that
       happened to a booking, not a reason for the booking to stop existing.

       `counterpart` links them, for the details page and for the card that has
       to know it is somebody's original. `same_stay_as` marks the one of the
       pair that is not counted again where the account is totted up — one stay
       was booked here, however many bookings it took. */
    var byId = {};
    list.forEach(function (b) { byId[b.id] = b; });
    list.forEach(function (b) {
      if (b.switched_from && byId[b.switched_from]) {
        var old = byId[b.switched_from];
        b.counterpart = old;
        old.counterpart = b;
        old.same_stay_as = b.id;
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

  /* The list is the whole account. Every status state in SEED is a case the
     page has to answer for, so all of them are on it — holding the rest behind
     ?all=1 meant the states nobody had to look at were the ones free to rot. */

  /* Upcoming only, by check-in ascending. A stay that has already happened has
     nothing left to track and no decision attached to it, so it does not belong
     on this page — past bookings stay in the model for history elsewhere. */
  function sorted() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return all()
      .filter(function (b) { return new Date(b.check_out) >= today; })
      /* Both records stand, before the release and after it. A switch leaves
         two bookings on two systems; the list is where the guest sees what is
         held in their name, and one row for two bookings hides the one they
         are still on the hook for. */
      .sort(function (a, b) {
        var d = new Date(a.check_in) - new Date(b.check_in);
        if (d) return d;
        /* The pair shares a check-in, so date order alone leaves which of them
           comes first to the order they happen to be stored in. Ours leads and
           the record it replaced follows: the stay is read downwards, and the
           booking the guest is actually turning up on is the one to meet
           first. */
        if (a.same_stay_as === b.id) return 1;
        if (b.same_stay_as === a.id) return -1;
        return 0;
      });
  }

  /* Open cancel tasks. Drives the amber banner(s) on /bookings. More than one
     can be outstanding — a user can switch two stays before cancelling either. */
  function openCancelTasks() {
    /* Derived from the visible list, never from all() — a task pointing at a
       row the user cannot see is worse than no task. */
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
       platform until the guest cancels it themselves. The task belongs to the
       booking it is about: it is the original that has to be released, so the
       original's page carries the sequence and the way out. The booking we
       made is simply confirmed, and says nothing about anybody else's. */
    var old = (tracked && b.switch_event) ? b : null;
    var ours = old ? old.counterpart : null;
    var owes = old && !old.switch_event.user_marked_cancelled_at
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
        bookedOurs: ours ? fmt.day(ours.created_at) : '',
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
      /* The standing offer on a tracked stay: what they paid against what we
         would charge. Only when it is like-for-like and actually cheaper —
         `compare` has already made that judgement — and only while the offer
         is still open to take. Once this stay has been switched we hold the
         booking, and `compare` keeps returning a saving because our price is
         still lower than theirs; leaving that on the page put a cart offering
         to book a stay we had already booked. A switch closes the offer.
         `watch()` has said this all along (kind 'switched'); this is the same
         judgement, in the shape the details page reads. */
      saving: tracked && !b.switch_event && b.comparison && b.comparison.isSaving ? {
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
    platforms: PLATFORMS,
    voucherFields: VOUCHER_FIELDS,
    settleMs: SETTLE_MS,
    mailbox: MAILBOX,
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

    /* ---------- auto-track ----------
       Granted on Google's page and recorded here on the way back. `null` until
       they have, so the rail can ask; an address and a date once they have, so
       it can say whose mailbox it is reading and stop asking. */
    gmail: function () { return readState().gmail || null; },

    /* Read access to someone's mail is a large thing to ask, and the moment it
       is askable is narrow: just after they booked with us, while the trust
       that pays for the question is a thing that just happened rather than a
       fact on file. So the ask is armed by the booking and not by the account
       having one — an account that has booked and never been asked is not the
       same as one that booked a minute ago.

       Set by both routes to a stay of ours: paying through checkout, and
       switching a tracked booking over. */
    noteBookingMade: function () {
      var s = readState();
      s.booked_at = new Date().toISOString();
      writeState(s);
    },

    shouldAskGmail: function () {
      var s = readState();
      return !!s.booked_at && !s.gmail;
    },

    /* Asked and answered, either way. The next booking arms it again. */
    clearGmailAsk: function () {
      var s = readState();
      delete s.booked_at;
      writeState(s);
    },

    connectGmail: function (address) {
      var s = readState();
      s.gmail = {
        address: address || MAILBOX,
        connected_at: new Date().toISOString()
      };
      writeState(s);
      return clone(s.gmail);
    },

    /* Access we were given and can be told to stop using. Bookings already on
       the list stay: they are the guest's bookings, not ours to withdraw.
       Nothing on the bookings page offers this — withdrawing belongs with the
       account, next to everything else they granted, and Google's own account
       page can revoke it whether we offer it or not. */
    disconnectGmail: function () {
      var s = readState();
      delete s.gmail;
      writeState(s);
    },

    /* ---------- 1.x ingest ----------
       What the voucher they just handed over reads as. Peeked, not consumed:
       a read they abandon costs them nothing and leaves the queue where it
       was, so the next upload is still this one. */
    readVoucher: function (i) {
      /* `i` is the prototype's state switch forcing a particular read. Nothing
         in the product passes it — drop the argument and this stays true. */
      if (typeof i === 'number') return clone(INBOX[i % INBOX.length]);
      var s = readState();
      return clone(INBOX[(s.ingest || 0) % INBOX.length]);
    },

    /* Something on the list that this voucher might already be. Same property,
       and nights that touch — not nights that match: a booking amended after
       it was made is still the same booking, and that is precisely the case we
       cannot tell from a second one.

       It returns a candidate and never a verdict. Two rooms booked separately
       for the same nights at the same hotel look identical from here, and so
       does the same booking uploaded twice; what separates them may be a line
       we failed to read, or one that was never on the document. The guest is
       the only party who knows, so this finds and they decide. */
    findSimilar: function (v) {
      if (!v || !v.parsed) return null;
      var name = String(v.property_name_raw || '').toLowerCase();
      return all().filter(function (b) {
        if (b.same_stay_as) return false;
        var same = (v.property_id && b.property_id)
          ? v.property_id === b.property_id
          : String(b.property_name_raw || '').toLowerCase() === name;
        return same &&
               new Date(v.check_in) < new Date(b.check_out) &&
               new Date(b.check_in) < new Date(v.check_out);
      })[0] || null;
    },

    /* The read becomes a booking on the list either way. `flagged` is the
       guest saying the read is wrong, or our own parse coming back short —
       and a booking they have handed us should not disappear because we
       misread a line of it. It goes on as 'pending', which is the state the
       model already has for a read nobody has stood behind yet: the list says
       it is being checked, and it stays there until a person has been through
       it. Only a confirmed read is given a `settle_at` and allowed to become
       a live watch on its own. */
    addTracked: function (v, flagged) {
      var s = readState();
      var n = s.ingest || 0;
      var id = 'bk-ing-' + (n + 1);
      s.created = (s.created || []).concat([{
        id: id,
        ownership: 'tracked',
        source_platform: v.source_platform,
        property_id: v.property_id,
        property_name_raw: v.property_name_raw,
        location: v.location,
        stars: v.stars,
        check_in: v.check_in, check_out: v.check_out,
        room_category: v.room_category,
        occupancy: v.occupancy,
        meal_plan: v.meal_plan,
        cancellation_policy: v.cancellation_policy,
        free_cancellation_until: v.free_cancellation_until,
        price_paid_total: v.price_paid_total,
        currency: v.currency,
        status: 'pending',
        /* the document itself is kept, permanently, whatever happens next */
        raw_artifact_ref: v.raw_artifact_ref || null,
        parse_confidence: v.parse_confidence,
        created_at: new Date().toISOString(),
        last_checked_at: null,
        image: v.image,
        our_offer: v.our_price_total == null ? null : {
          room_category: v.room_category,
          occupancy: v.occupancy,
          meal_plan: v.meal_plan,
          cancellation_policy: v.cancellation_policy,
          free_cancellation_until: v.free_cancellation_until,
          our_price_total: v.our_price_total,
          room_matched: true,
          availability: 'available'
        },
        /* with a person still to look at it, nothing is owed to the guest but
           the truth that it is being looked at */
        flagged_at: flagged ? new Date().toISOString() : null,
        /* no history on a stay we have only just started watching */
        observations: [],
        settle_at: flagged ? null : new Date(Date.now() + SETTLE_MS).toISOString(),
        settled_status: v.settles_to || 'no_saving_up'
      }]);
      s.ingest = n + 1;
      writeState(s);
      return id;
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
      /* a stay of ours, made just now — the same event checkout ends on, and
         it arms the auto-track ask the same way */
      s.booked_at = new Date().toISOString();
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

    reset: function () {
      try { localStorage.removeItem(NS); } catch (e) {}
    }
  };

  function setOverrideOn(s, id, patch) {
    s.overrides = s.overrides || {};
    s.overrides[id] = Object.assign({}, s.overrides[id], patch);
  }

  root.Tracking = api;
})(window);
