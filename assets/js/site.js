/* Epicuria — shared site behaviour */
(function () {
  "use strict";

  var cfg = window.EPICURIA_CONFIG || {};
  var restaurant = cfg.restaurant || {};
  var currency = cfg.currency || { locale: "en-IN", code: "INR" };

  var moneyFormatter;
  try {
    moneyFormatter = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 0
    });
  } catch (error) {
    moneyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  function money(value) {
    var amount = Number(value);
    return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  var ICONS = {
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    alert:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5h3V5h-3c-2.5 0-4.5 2-4.5 4.5V12H7v3.5h2.5V21H13v-5.5h3l.5-3.5H13V9.5c0-.6.4-1 1-1Z"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3l-6.6 7.5L21.8 21h-6.1l-4.8-6.3L5.4 21h-3l7-8-6.8-10h6.2l4.4 5.8L17.5 3Zm-1.1 16.2h1.7L7.6 4.7H5.8l10.6 14.5Z"/></svg>'
  };

  function showToast(message, options) {
    options = options || {};
    var region = document.querySelector(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "false");
      document.body.appendChild(region);
    }

    var toast = document.createElement("div");
    toast.className = "toast" + (options.type === "error" ? " toast--error" : "");
    toast.setAttribute("role", "status");

    var icon = document.createElement("span");
    icon.innerHTML = options.type === "error" ? ICONS.alert : ICONS.check;
    toast.appendChild(icon.firstChild);

    var text = document.createElement("div");
    text.textContent = message;
    if (options.action && options.action.href) {
      var link = document.createElement("a");
      link.href = options.action.href;
      link.textContent = options.action.label || "View cart";
      text.appendChild(document.createTextNode(" "));
      text.appendChild(link);
    }
    toast.appendChild(text);
    region.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("is-leaving");
      setTimeout(function () {
        toast.remove();
      }, 260);
    }, options.duration || 3600);
  }

  function initNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("site-nav");
    var backdrop = document.querySelector("[data-nav-backdrop]");
    if (!toggle || !nav) return;

    var media = window.matchMedia("(max-width: 980px)");

    function isOpen() {
      return document.body.classList.contains("nav-open");
    }

    function syncInert() {
      if (media.matches) {
        nav.inert = !isOpen();
      } else {
        nav.inert = false;
      }
    }

    function open() {
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      syncInert();
      var first = nav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }

    function close(restoreFocus) {
      if (!isOpen()) return;
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      syncInert();
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) close(true);
      else open();
    });

    if (backdrop) backdrop.addEventListener("click", function () { close(false); });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) close(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) close(true);
    });

    media.addEventListener("change", function () {
      close(false);
      syncInert();
    });

    syncInert();
  }

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function fillConfig() {
    document.querySelectorAll("[data-config]").forEach(function (node) {
      var key = node.getAttribute("data-config");
      var value = restaurant[key];
      if (value) node.textContent = value;
    });

    document.querySelectorAll("[data-config-link]").forEach(function (node) {
      var type = node.getAttribute("data-config-link");
      if (type === "phone" && restaurant.phone) {
        var dial = restaurant.phone.replace(/\D/g, "");
        // Keep looking like the displayed number when it is still a placeholder;
        // never collapse "+91 xxxxxxxxxx" down to a misleading "tel:+91".
        node.href = "tel:" + (dial.length >= 7 ? dial : restaurant.phone.replace(/\s/g, ""));
      } else if (type === "email" && restaurant.email) {
        node.href = "mailto:" + restaurant.email;
      } else if (type === "map" && restaurant.mapUrl) {
        node.href = restaurant.mapUrl;
      } else if (type === "ordering-email") {
        node.href = "mailto:" + (cfg.ordering && cfg.ordering.email ? cfg.ordering.email : restaurant.email || "");
      }
    });

    document.querySelectorAll("[data-hide-if-empty]").forEach(function (node) {
      var key = node.getAttribute("data-hide-if-empty");
      var value = restaurant[key];
      if (!value) node.hidden = true;
    });

    var yearNodes = document.querySelectorAll("[data-year]");
    yearNodes.forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });

    renderSocials();
  }

  function renderSocials() {
    document.querySelectorAll("[data-socials]").forEach(function (container) {
      container.innerHTML = "";
      var socials = cfg.socials || {};
      Object.keys(socials).forEach(function (key) {
        var url = socials[key];
        if (!url || !/^https?:\/\//i.test(url)) return;
        var link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", "Epicuria on " + key);
        link.innerHTML = ICONS[key] || ICONS.info;
        container.appendChild(link);
      });
      if (!container.children.length) container.hidden = true;
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (item) { observer.observe(item); });
  }

  function initDialogs() {
    document.querySelectorAll("[data-dialog-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        var dialog = button.closest("dialog");
        if (dialog) dialog.close();
      });
    });

    document.querySelectorAll("dialog").forEach(function (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function injectStructuredData() {
    var name = restaurant.name || (cfg.brand && cfg.brand.name);
    if (!name || document.querySelector("script[data-epicuria-schema]")) return;
    var socials = Object.keys(cfg.socials || {})
      .map(function (key) { return cfg.socials[key]; })
      .filter(function (url) { return url && /^https?:\/\//i.test(url); });

    var data = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: name,
      description: cfg.brand && cfg.brand.shortDescription,
      url: cfg.siteUrl,
      image: (cfg.siteUrl || "") + "assets/img/brand/og-image.jpg",
      telephone: restaurant.phone,
      email: restaurant.email,
      servesCuisine: ["Indian", "Italian", "Chinese", "Mexican", "French"],
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        streetAddress: restaurant.address,
        addressCountry: "IN"
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: (cfg.reservation && cfg.reservation.openTime) || "12:00",
        closes: (cfg.reservation && cfg.reservation.closeTime) || "23:00"
      },
      hasMenu: (cfg.siteUrl || "") + "menu.html",
      acceptsReservations: (cfg.siteUrl || "") + "reservation.html",
      sameAs: socials
    };

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-epicuria-schema", "");
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function init() {
    fillConfig();
    initNavigation();
    initHeader();
    initReveal();
    initDialogs();
    injectStructuredData();
  }

  window.Epicuria = {
    config: cfg,
    money: money,
    escapeHtml: escapeHtml,
    debounce: debounce,
    toast: showToast,
    icons: ICONS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
