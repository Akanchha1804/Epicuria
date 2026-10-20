/* Epicuria — shared form helpers */
(function () {
  "use strict";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toISODate(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function addDays(days) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  }

  function combine(dateValue, timeValue) {
    if (!dateValue || !timeValue) return null;
    var dateParts = dateValue.split("-").map(Number);
    var timeParts = timeValue.split(":").map(Number);
    if (dateParts.length !== 3 || timeParts.length < 2) return null;
    var date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0, 0);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  function formatDate(dateValue) {
    var date = combine(dateValue, "12:00");
    if (!date) return "";
    return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function formatTime(timeValue) {
    if (!timeValue) return "";
    var parts = timeValue.split(":").map(Number);
    var date = new Date(2000, 0, 1, parts[0] || 0, parts[1] || 0);
    return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  }

  function setError(input, message) {
    var field = input.closest(".field");
    input.setAttribute("aria-invalid", "true");
    if (field) {
      var error = field.querySelector(".field__error");
      if (error) error.textContent = message;
    }
    input.focus({ preventScroll: false });
  }

  function clearError(input) {
    var field = input.closest(".field");
    input.removeAttribute("aria-invalid");
    if (field) {
      var error = field.querySelector(".field__error");
      if (error) error.textContent = "";
    }
  }

  function clearErrors(form) {
    form.querySelectorAll("[aria-invalid]").forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });
    form.querySelectorAll(".field__error").forEach(function (error) {
      error.textContent = "";
    });
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isPhone(value) {
    var number = digits(value);
    return number.length >= 7 && number.length <= 15;
  }

  function randomRef(prefix) {
    var now = new Date();
    var stamp = String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate());
    var random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return prefix + "-" + stamp + "-" + random;
  }

  function mailto(to, subject, body) {
    return "mailto:" + encodeURIComponent(to || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function whatsapp(number, text) {
    var clean = digits(number);
    return "https://wa.me/" + clean + "?text=" + encodeURIComponent(text);
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  function postJSON(endpoint, payload) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
      .then(function (response) {
        clearTimeout(timer);
        if (!response.ok) throw new Error("Request failed with status " + response.status);
        return response.json().catch(function () { return {}; });
      })
      .catch(function (error) {
        clearTimeout(timer);
        throw error;
      });
  }

  window.FormUtils = {
    todayISO: function () { return toISODate(new Date()); },
    isoDate: toISODate,
    maxDateISO: function (days) { return toISODate(addDays(days || 90)); },
    addDays: addDays,
    combine: combine,
    formatDate: formatDate,
    formatTime: formatTime,
    setError: setError,
    clearError: clearError,
    clearErrors: clearErrors,
    isEmail: isEmail,
    isPhone: isPhone,
    digits: digits,
    ref: randomRef,
    mailto: mailto,
    whatsapp: whatsapp,
    copy: copy,
    postJSON: postJSON
  };
})();
