/* Epicuria — cart store (localStorage) */
(function () {
  "use strict";

  var KEY = "epicuria.cart.v1";
  var MAX_QTY = 99;

  function cleanText(value, max) {
    return String(value == null ? "" : value).trim().slice(0, max || 240);
  }

  function normalizeCustomizations(raw) {
    if (!raw) return null;
    var excluded = Array.isArray(raw.excluded)
      ? raw.excluded.map(function (item) { return cleanText(item, 80); }).filter(Boolean).slice(0, 20)
      : [];
    var note = cleanText(raw.note, 300);
    if (!excluded.length && !note) return null;
    return { excluded: excluded, note: note };
  }

  function signature(item) {
    if (item.key) return String(item.key);
    var custom = item.customizations ? JSON.stringify(item.customizations) : "";
    return String(item.id) + "|" + custom;
  }

  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return null;
    var id = Number(raw.id);
    var price = Number(raw.price);
    var qty = Math.floor(Number(raw.qty));
    if (!Number.isFinite(id) || !Number.isFinite(price) || price < 0) return null;
    if (!Number.isFinite(qty) || qty < 1) return null;
    var item = {
      id: id,
      name: cleanText(raw.name, 120),
      price: Math.round(price),
      image: cleanText(raw.image, 300),
      qty: Math.min(qty, MAX_QTY),
      customizations: normalizeCustomizations(raw.customizations)
    };
    if (!item.name) return null;
    item.key = signature(item);
    return item;
  }

  function read() {
    var raw;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch (error) {
      return [];
    }
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      var seen = {};
      return parsed
        .map(sanitize)
        .filter(function (item) {
          if (!item) return false;
          if (seen[item.key]) return false;
          seen[item.key] = true;
          return true;
        });
    } catch (error) {
      return [];
    }
  }

  function write(items) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch (error) {
      if (window.Epicuria) {
        window.Epicuria.toast("Your browser could not save the cart. Storage may be full or disabled.", { type: "error" });
      }
    }
    sync(items);
  }

  function countOf(items) {
    return items.reduce(function (total, item) { return total + item.qty; }, 0);
  }

  function subtotalOf(items) {
    return items.reduce(function (total, item) { return total + item.price * item.qty; }, 0);
  }

  function sync(items) {
    items = items || read();
    var count = countOf(items);
    var badge = document.querySelectorAll("[data-cart-count]");
    badge.forEach(function (node) {
      node.textContent = String(count);
      node.hidden = count === 0;
    });
    document.querySelectorAll("[data-cart-link]").forEach(function (node) {
      node.setAttribute("aria-label", count === 0 ? "Cart, empty" : "Cart, " + count + (count === 1 ? " item" : " items"));
    });
    document.dispatchEvent(
      new CustomEvent("epicuria:cart-change", { detail: { items: items, count: count, subtotal: subtotalOf(items) } })
    );
  }

  var Cart = {
    key: KEY,

    items: function () {
      return read();
    },

    count: function () {
      return countOf(read());
    },

    subtotal: function () {
      return subtotalOf(read());
    },

    add: function (item, qty) {
      var quantity = Math.max(1, Math.min(MAX_QTY, Math.floor(Number(qty) || 1)));
      var items = read();
      var normalized = sanitize({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        qty: quantity,
        customizations: item.customizations,
        key: item.key
      });
      if (!normalized) return false;

      var existing = items.find(function (entry) { return entry.key === normalized.key; });
      if (existing) {
        existing.qty = Math.min(MAX_QTY, existing.qty + quantity);
      } else {
        items.push(normalized);
      }
      write(items);
      return true;
    },

    setQty: function (key, qty) {
      var quantity = Math.floor(Number(qty));
      var items = read();
      var item = items.find(function (entry) { return entry.key === key; });
      if (!item) return;
      if (!Number.isFinite(quantity) || quantity < 1) {
        items = items.filter(function (entry) { return entry.key !== key; });
      } else {
        item.qty = Math.min(MAX_QTY, quantity);
      }
      write(items);
    },

    remove: function (key) {
      write(read().filter(function (entry) { return entry.key !== key; }));
    },

    clear: function () {
      write([]);
    },

    onChange: function (handler) {
      document.addEventListener("epicuria:cart-change", function (event) {
        handler(event.detail);
      });
    }
  };

  window.Cart = Cart;

  window.addEventListener("storage", function (event) {
    if (event.key === KEY) sync(read());
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { sync(); });
  } else {
    sync();
  }
})();
