/* ============================================================
   Prajna Co-hab — site config
   ------------------------------------------------------------
   LIVE DATA. Every figure below was supplied by the owner on
   2026-10-02 and is now published on the site.

   CONTACT MODEL: the owner's number is NEVER published. Visitors
   email; the number is handed over in the reply if they want to
   talk. So `email` is public and `phone` stays blank permanently -
   leaving `phone` blank is deliberate, not an oversight.
   ============================================================ */
window.PRAJNA = {

  /* ---- CONTACT -------------------------------------------------
     >>> REPLACE THIS WITH THE REAL ADDRESS. It is a visible
     >>> placeholder until you do. The number below stays blank
     >>> forever by design - it is handed out in email replies.
     ------------------------------------------------------------ */
  email: "prajna.cohab@gmail.com",
  phone: "",                // NEVER publish this.

  /* ---- RENT ----------------------------------------------------
     Two meal plans. "With dinner" means DINNER ONLY - breakfast
     and lunch are not included at either price, and the site says
     so plainly rather than letting people find out later.
     ---------------------------------------------------------- */
  twinRent: 7200,           // double sharing, WITHOUT dinner
  twinRentMeal: 10000,      // double sharing, WITH dinner
  singleRent: 9200,         // private, WITHOUT dinner
  singleRentMeal: 12000,    // private, WITH dinner

  twinDeposit: 12000,
  singleDeposit: 14000,

  /* ---- AVAILABILITY: nothing free as of 2026-10-02 ---- */
  bedsOpen: 0,
  availability: "No beds free right now — tell us when you’re looking and we’ll put you first when one opens",

  /* ---- TERMS ---- */
  lockInMonths: 3,
  noticeMonths: 1,

  /* ---- FORM BACKEND ----
     Optional Google Apps Script endpoint. Empty = the forms open
     a pre-filled email to `email` instead, so they already work
     with no backend at all. Set this when you have a /exec URL. */
  endpoint: "",
  community: "",
  ownerNote: "Family-run. Owner-managed. No broker."
};

/* No preview banner: the data above is real, so there is nothing
   left to warn a visitor about. */