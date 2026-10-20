/* Epicuria — reservation request flow */
(function () {
  "use strict";

  var form = document.querySelector("[data-reservation-form]");
  if (!form) return;

  var cfg = window.Epicuria.config || {};
  var settings = cfg.reservation || {};
  var statusNode = form.querySelector("[data-form-status]");
  var submitButton = form.querySelector("[type='submit']");
  var successNode = document.querySelector("[data-reservation-success]");
  var formShell = document.querySelector("[data-reservation-shell]");
  var reference = window.FormUtils.ref("RS");

  function field(name) {
    return form.elements[name];
  }

  function configureInputs() {
    var date = field("date");
    var time = field("time");
    var guests = field("guests");
    date.min = window.FormUtils.todayISO();
    date.max = window.FormUtils.maxDateISO(90);
    time.min = settings.openTime || "12:00";
    time.max = settings.closeTime || "22:30";
    guests.min = String(settings.minGuests || 1);
    guests.max = String(settings.maxGuests || 20);

    if (!date.value) {
      var now = new Date();
      var latest = (settings.openTime || "12:00").split(":").map(Number);
      var close = (settings.closeTime || "22:30").split(":").map(Number);
      var minutes = now.getHours() * 60 + now.getMinutes();
      var openMinutes = latest[0] * 60 + (latest[1] || 0);
      var closeMinutes = close[0] * 60 + (close[1] || 0);
      var target = new Date(now);

      if (minutes + 60 > closeMinutes) {
        target = window.FormUtils.addDays(1);
        target.setHours(19, 0, 0, 0);
      } else if (minutes + 60 < openMinutes) {
        target.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
      } else {
        target.setMinutes(target.getMinutes() + 60, 0, 0);
      }
      date.value = window.FormUtils.isoDate(target);
      time.value = String(target.getHours()).padStart(2, "0") + ":" + String(target.getMinutes()).padStart(2, "0");
      guests.value = guests.value || "2";
    }
  }

  function validate() {
    window.FormUtils.clearErrors(form);
    var firstInvalid = null;

    var name = field("name");
    if (!name.value.trim() || name.value.trim().length < 2) {
      window.FormUtils.setError(name, "Please enter your full name.");
      firstInvalid = firstInvalid || name;
    }

    var phone = field("phone");
    if (!window.FormUtils.isPhone(phone.value)) {
      window.FormUtils.setError(phone, "Enter a phone number with 7–15 digits.");
      firstInvalid = firstInvalid || phone;
    }

    var email = field("email");
    if (!email.value.trim()) {
      window.FormUtils.setError(email, "Please add an email for your confirmation.");
      firstInvalid = firstInvalid || email;
    } else if (!window.FormUtils.isEmail(email.value)) {
      window.FormUtils.setError(email, "That email address does not look right.");
      firstInvalid = firstInvalid || email;
    }

    var date = field("date");
    var time = field("time");
    var guests = field("guests");
    if (!date.value) {
      window.FormUtils.setError(date, "Choose a date for your visit.");
      firstInvalid = firstInvalid || date;
    }
    if (!time.value) {
      window.FormUtils.setError(time, "Choose a preferred time.");
      firstInvalid = firstInvalid || time;
    }

    var guestCount = Number(guests.value);
    var minGuests = Number(settings.minGuests) || 1;
    var maxGuests = Number(settings.maxGuests) || 20;
    if (!Number.isFinite(guestCount) || guestCount < minGuests || guestCount > maxGuests) {
      window.FormUtils.setError(guests, "Enter between " + minGuests + " and " + maxGuests + " guests.");
      firstInvalid = firstInvalid || guests;
    }

    if (date.value && time.value) {
      var chosen = window.FormUtils.combine(date.value, time.value);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var chosenDay = window.FormUtils.combine(date.value, "00:00");
      if (!chosen) {
        window.FormUtils.setError(time, "That date and time is not valid.");
        firstInvalid = firstInvalid || time;
      } else if (chosenDay < today) {
        window.FormUtils.setError(date, "Reservation date cannot be in the past.");
        firstInvalid = firstInvalid || date;
      } else {
        var open = (settings.openTime || "12:00").split(":").map(Number);
        var close = (settings.closeTime || "22:30").split(":").map(Number);
        var minutes = chosen.getHours() * 60 + chosen.getMinutes();
        if (minutes < open[0] * 60 + (open[1] || 0) || minutes > close[0] * 60 + (close[1] || 0)) {
          window.FormUtils.setError(time, "Choose a time between " + window.FormUtils.formatTime(settings.openTime || "12:00") + " and " + window.FormUtils.formatTime(settings.closeTime || "22:30") + ".");
          firstInvalid = firstInvalid || time;
        } else if (chosen <= new Date()) {
          window.FormUtils.setError(time, "Please choose a time in the future.");
          firstInvalid = firstInvalid || time;
        }
      }
    }

    if (firstInvalid) firstInvalid.focus({ preventScroll: false });
    return !firstInvalid;
  }

  function buildReservation() {
    var seating = form.querySelector("input[name='seating']:checked");
    return {
      reference: reference,
      createdAt: new Date().toISOString(),
      customer: {
        name: field("name").value.trim(),
        phone: field("phone").value.trim(),
        email: field("email").value.trim()
      },
      date: field("date").value,
      time: field("time").value,
      guests: Number(field("guests").value),
      seating: seating ? seating.value : "No preference",
      occasion: field("occasion").value,
      notes: field("notes").value.trim()
    };
  }

  function reservationText(reservation) {
    return [
      "Epicuria — reservation request " + reservation.reference,
      "",
      "Name: " + reservation.customer.name,
      "Phone: " + reservation.customer.phone,
      "Email: " + reservation.customer.email,
      "Date: " + window.FormUtils.formatDate(reservation.date),
      "Time: " + window.FormUtils.formatTime(reservation.time),
      "Guests: " + reservation.guests,
      "Seating: " + reservation.seating,
      reservation.occasion ? "Occasion: " + reservation.occasion : "",
      reservation.notes ? "Notes: " + reservation.notes : "",
      "",
      "Please confirm availability. This request is not a confirmed booking until the restaurant replies."
    ]
      .filter(Boolean)
      .join("\n");
  }

  function showStatus(message, type) {
    if (!statusNode) return;
    statusNode.className = "form-status is-visible " + (type === "error" ? "form-status--error" : "form-status--success");
    statusNode.innerHTML = "";
    var icon = document.createElement("span");
    icon.innerHTML = type === "error" ? window.Epicuria.icons.alert : window.Epicuria.icons.check;
    statusNode.appendChild(icon.firstChild);
    var text = document.createElement("div");
    text.textContent = message;
    statusNode.appendChild(text);
  }

  function showConfirmation(reservation, submitted) {
    if (!successNode) return;
    var text = reservationText(reservation);
    var email = (settings.email || (cfg.restaurant && cfg.restaurant.email) || "").trim();
    var mailLink = email ? window.FormUtils.mailto(email, "Epicuria reservation " + reservation.reference, text) : "";
    var waLink = settings.whatsapp ? window.FormUtils.whatsapp(settings.whatsapp, text) : "";

    successNode.innerHTML = "";

    var card = document.createElement("div");
    card.className = "confirmation";

    var icon = document.createElement("div");
    icon.className = "confirmation__icon";
    icon.innerHTML = window.Epicuria.icons.check;
    card.appendChild(icon);

    var heading = document.createElement("h2");
    heading.textContent = submitted ? "Reservation request received" : "Your request is ready to send";
    card.appendChild(heading);

    var ref = document.createElement("span");
    ref.className = "confirmation__ref";
    ref.textContent = "Reference " + reservation.reference;
    card.appendChild(ref);

    var copy = document.createElement("p");
    copy.className = "muted";
    copy.textContent = submitted
      ? "Thank you, " + reservation.customer.name + ". This is a request, not a confirmed booking yet. We will contact you to confirm availability."
      : "Send your request to the restaurant by email" + (waLink ? " or WhatsApp" : "") + ". We will reply to confirm availability. Nothing has been charged.";
    card.appendChild(copy);

    var summary = document.createElement("div");
    summary.className = "summary-row";
    var label = document.createElement("span");
    label.textContent =
      reservation.guests + (reservation.guests === 1 ? " guest" : " guests") + " · " +
      window.FormUtils.formatDate(reservation.date) + " · " +
      window.FormUtils.formatTime(reservation.time);
    summary.appendChild(label);
    var seating = document.createElement("strong");
    seating.textContent = reservation.seating;
    summary.appendChild(seating);
    card.appendChild(summary);

    var actions = document.createElement("div");
    actions.className = "confirmation__actions";

    if (!submitted) {
      if (mailLink) {
        var emailButton = document.createElement("a");
        emailButton.className = "btn btn--gold";
        emailButton.href = mailLink;
        emailButton.textContent = "Email request";
        actions.appendChild(emailButton);
      }
      if (waLink) {
        var waButton = document.createElement("a");
        waButton.className = "btn btn--ghost";
        waButton.href = waLink;
        waButton.target = "_blank";
        waButton.rel = "noopener";
        waButton.textContent = "WhatsApp request";
        actions.appendChild(waButton);
      }
    }

    var copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "btn btn--ghost";
    copyButton.textContent = "Copy details";
    copyButton.addEventListener("click", function () {
      window.FormUtils.copy(text).then(
        function () { window.Epicuria.toast("Reservation details copied."); },
        function () { window.Epicuria.toast("Could not copy automatically.", { type: "error" }); }
      );
    });
    actions.appendChild(copyButton);

    var printButton = document.createElement("button");
    printButton.type = "button";
    printButton.className = "btn btn--ghost";
    printButton.textContent = "Print";
    printButton.addEventListener("click", function () { window.print(); });
    actions.appendChild(printButton);

    card.appendChild(actions);
    successNode.appendChild(card);
    successNode.hidden = false;
    if (formShell) formShell.hidden = true;
    successNode.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("input", function (event) {
    if (event.target.matches("input, select, textarea")) window.FormUtils.clearError(event.target);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validate()) {
      showStatus("Please check the highlighted fields and try again.", "error");
      return;
    }

    var reservation = buildReservation();
    try {
      window.localStorage.setItem("epicuria.last-reservation", JSON.stringify(reservation));
    } catch (error) {
      /* storage is optional */
    }

    submitButton.disabled = true;
    submitButton.classList.add("btn--loading");
    showStatus("Sending your request…", "success");

    if (settings.endpoint) {
      window.FormUtils.postJSON(settings.endpoint, {
        _subject: "Epicuria reservation " + reservation.reference,
        type: "reservation",
        reservation: reservation
      })
        .then(function () {
          submitButton.disabled = false;
          submitButton.classList.remove("btn--loading");
          showConfirmation(reservation, true);
        })
        .catch(function () {
          submitButton.disabled = false;
          submitButton.classList.remove("btn--loading");
          showStatus("We could not send the request automatically. Use the email option below, or call us.", "error");
          showConfirmation(reservation, false);
        });
    } else {
      submitButton.disabled = false;
      submitButton.classList.remove("btn--loading");
      showConfirmation(reservation, false);
    }
  });

  configureInputs();
})();
