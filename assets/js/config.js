/* ==========================================================================
   Epicuria — site configuration
   --------------------------------------------------------------------------
   Everything a restaurant owner is likely to change lives here.
   Replace the placeholder phone number, address and social links before launch.
   Set `ordering.endpoint` / `reservation.endpoint` to a form service
   (for example a Formspree URL) to receive submissions without a backend.
   Leave them empty to use the email/WhatsApp fallback.
   ========================================================================== */

window.EPICURIA_CONFIG = {
  siteUrl: "https://akanchha1804.github.io/Epicuria/",

  brand: {
    name: "Epicuria",
    tagline: "Divine · Luxurious Taste · Cosy Atmosphere",
    shortDescription:
      "A modern dining room where Indian soul food meets a world kitchen — plated with care, served with warmth."
  },

  restaurant: {
    // TODO before launch: replace with the real restaurant details.
    // Call links dial a real number once this contains 7+ digits.
    phone: "+91 xxxxxxxxxx",
    email: "sakanchha47@gmail.com",
    address: "123 xyz street, Agra",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=123+xyz+street+Agra",
    hours: "12:00 PM – 11:00 PM",
    hoursShort: "Open daily · 12–11 PM"
  },

  currency: {
    locale: "en-IN",
    code: "INR"
  },

  ordering: {
    // Pickup / pre-order requests. `whatsapp` is digits only, e.g. "919876543210".
    whatsapp: "",
    email: "sakanchha47@gmail.com",
    endpoint: "", // optional POST endpoint (Formspree, Basin, etc.)
    earliestPickupMinutes: 30,
    requireEmail: true
  },

  reservation: {
    whatsapp: "",
    email: "sakanchha47@gmail.com",
    endpoint: "", // optional POST endpoint
    minGuests: 1,
    maxGuests: 20,
    openTime: "12:00",
    closeTime: "22:30",
    seating: ["Indoor", "Outdoor", "No preference"]
  },

  socials: {
    instagram: "",
    facebook: "",
    x: ""
  },

  featuredDishIds: [54, 59, 63, 7]
};
