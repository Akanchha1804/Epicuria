/* Epicuria — checkout / pickup order flow */
(function () {
  "use strict";

  var form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  var cfg = window.Epicuria.config || {};
  var ordering = cfg.ordering || {};
  var emptyNode = document.querySelector("[data-checkout-empty]");
  var contentNode = document.querySelector("[data-checkout-content]");
  var successNode = document.querySelector("[data-checkout-success]");
  var summaryRoot = document.querySelector("[data-order-items]");
  var subtotalNode = document.querySelector("[data-order-subtotal]");
  var countNode = document.querySelector("[data-order-count]");
  var statusNode = form.querySelector("[data-form-status]");
  var submitButton = form.querySelector("[type='submit']");

  var items = window.Cart.items();
  var orderRef = window.FormUtils.ref("EP");

  if (!items.length) {
    if (emptyNode) emptyNode.hidden = false;
    if (contentNode) contentNode.hidden = true;
    return;
  }

  if (emptyNode) emptyNode.hidden = true;
  if (contentNode) contentNode.hidden = false;

  function renderSummary() {
    summaryRoot.innerHTML = "";
    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "order-summary-item";

      if (item.image) {
        var image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;
        image.loading = "lazy";
        image.width = 46;
        image.height = 46;
        row.appendChild(image);
      } else {
        row.appendChild(document.createElement("span"));
      }

      var info = document.createElement("div");
      var name = document.createElement("strong");
      name.textContent = item.name + " × " + item.qty;
      info.appendChild(name);
      if (item.customizations) {
        var custom = document.createElement("span");
        var bits = [];
        if (item.customizations.excluded && item.customizations.excluded.length) {
          bits.push("no " + item.customizations.excluded.join(", "));
        }
        if (item.customizations.note) bits.push(item.customizations.note);
        custom.textContent = bits.join(" · ");
        info.appendChild(custom);
      }
      row.appendChild(info);

      var total = document.createElement("b");
      total.textContent = window.Epicuria.money(item.price * item.qty);
      row.appendChild(total);

      summaryRoot.appendChild(row);
    });

    var subtotal = window.Cart.subtotal();
    if (subtotalNode) subtotalNode.textContent = window.Epicuria.money(subtotal);
    if (countNode) countNode.textContent = String(window.Cart.count());
  }

  function setConstraintDefaults() {
    var dateInput = form.elements.date;
    var timeInput = form.elements.time;
    var open = (cfg.reservation && cfg.reservation.openTime) || "12:00";
    var close = (cfg.reservation && cfg.reservation.closeTime) || "22:30";

    dateInput.min = window.FormUtils.todayISO();
    dateInput.max = window.FormUtils.maxDateISO(30);
    timeInput.min = open;
    timeInput.max = close;

    if (!dateInput.value) {
      var now = new Date();
      var openParts = open.split(":").map(Number);
      var closeParts = close.split(":").map(Number);
      var openMinutes = openParts[0] * 60 + (openParts[1] || 0);
      var closeMinutes = closeParts[0] * 60 + (closeParts[1] || 0);
      var lead = Number(ordering.earliestPickupMinutes) || 30;
      var target = new Date(now.getTime() + lead * 60000);

      // Round up to the next five-minute slot so the suggested time is always
      // comfortably past the minimum lead time, even seconds after opening.
      target.setSeconds(0, 0);
      if (target.getMinutes() % 5) {
        target.setMinutes(target.getMinutes() + (5 - (target.getMinutes() % 5)));
      }

      var targetMinutes = target.getHours() * 60 + target.getMinutes();
      if (targetMinutes < openMinutes) {
        target.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
      } else if (targetMinutes > closeMinutes) {
        target = window.FormUtils.addDays(1);
        target.setHours(19, 0, 0, 0);
      }

      dateInput.value = window.FormUtils.isoDate(target);
      timeInput.value = String(target.getHours()).padStart(2, "0") + ":" + String(target.getMinutes()).padStart(2, "0");
    }
  }

  function field(name) {
    return form.elements[name];
  }

  function validate() {
    window.FormUtils.clearErrors(form);
    var firstInvalid = null;

    var name = field("name");
    if (!name.value.trim() || name.value.trim().length < 2) {
      window.FormUtils.setError(name, "Please enter the name for the order.");
      firstInvalid = firstInvalid || name;
    }

    var phone = field("phone");
    if (!window.FormUtils.isPhone(phone.value)) {
      window.FormUtils.setError(phone, "Enter a phone number with 7–15 digits.");
      firstInvalid = firstInvalid || phone;
    }

    var email = field("email");
    if (ordering.requireEmail !== false && !email.value.trim()) {
      window.FormUtils.setError(email, "Please add an email so we can confirm your order.");
      firstInvalid = firstInvalid || email;
    } else if (email.value.trim() && !window.FormUtils.isEmail(email.value)) {
      window.FormUtils.setError(email, "That email address does not look right.");
      firstInvalid = firstInvalid || email;
    }

    var date = field("date");
    var time = field("time");
    if (!date.value) {
      window.FormUtils.setError(date, "Choose a collection date.");
      firstInvalid = firstInvalid || date;
    }
    if (!time.value) {
      window.FormUtils.setError(time, "Choose a collection time.");
      firstInvalid = firstInvalid || time;
    }

    if (date.value && time.value) {
      var chosen = window.FormUtils.combine(date.value, time.value);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var chosenDay = window.FormUtils.combine(date.value, "00:00");
      var earliest = new Date(Date.now() + (Number(ordering.earliestPickupMinutes) || 30) * 60000);

      if (!chosen) {
        window.FormUtils.setError(time, "That date and time is not valid.");
        firstInvalid = firstInvalid || time;
      } else if (chosenDay < today) {
        window.FormUtils.setError(date, "Collection date cannot be in the past.");
        firstInvalid = firstInvalid || date;
      } else if (chosen < earliest) {
        window.FormUtils.setError(time, "Please choose a time at least " + (Number(ordering.earliestPickupMinutes) || 30) + " minutes from now.");
        firstInvalid = firstInvalid || time;
      } else {
        var open = (cfg.reservation && cfg.reservation.openTime) || "12:00";
        var close = (cfg.reservation && cfg.reservation.closeTime) || "22:30";
        var minutes = chosen.getHours() * 60 + chosen.getMinutes();
        var openParts = open.split(":").map(Number);
        var closeParts = close.split(":").map(Number);
        if (minutes < openParts[0] * 60 + openParts[1] || minutes > closeParts[0] * 60 + closeParts[1]) {
          window.FormUtils.setError(time, "The kitchen takes orders between " + window.FormUtils.formatTime(open) + " and " + window.FormUtils.formatTime(close) + ".");
          firstInvalid = firstInvalid || time;
        }
      }
    }

    if (firstInvalid) firstInvalid.focus({ preventScroll: false });
    return !firstInvalid;
  }

  function buildOrder() {
    var fulfilled = form.querySelector("input[name='fulfilment']:checked");
    return {
      reference: orderRef,
      createdAt: new Date().toISOString(),
      fulfilment: fulfilled ? fulfilled.value : "Pickup",
      customer: {
        name: field("name").value.trim(),
        phone: field("phone").value.trim(),
        email: field("email").value.trim()
      },
      date: field("date").value,
      time: field("time").value,
      notes: field("notes").value.trim(),
      items: items.map(function (item) {
        return {
          name: item.name,
          qty: item.qty,
          price: item.price,
          customizations: item.customizations
        };
      }),
      subtotal: window.Cart.subtotal()
    };
  }

  function orderText(order) {
    var lines = [
      "Epicuria — order " + order.reference,
      "",
      "Name: " + order.customer.name,
      "Phone: " + order.customer.phone,
      "Email: " + order.customer.email,
      "Fulfilment: " + order.fulfilment,
      "Date: " + window.FormUtils.formatDate(order.date),
      "Time: " + window.FormUtils.formatTime(order.time),
      "",
      "Items:"
    ];

    order.items.forEach(function (item) {
      lines.push("• " + item.qty + " × " + item.name + " — " + window.Epicuria.money(item.price * item.qty));
      if (item.customizations) {
        if (item.customizations.excluded && item.customizations.excluded.length) {
          lines.push("   Without: " + item.customizations.excluded.join(", "));
        }
        if (item.customizations.note) lines.push("   Note: " + item.customizations.note);
      }
    });

    lines.push("", "Subtotal: " + window.Epicuria.money(order.subtotal));
    if (order.notes) lines.push("Order notes: " + order.notes);
    lines.push("", "Prices are confirmed by the restaurant before preparation.");
    return lines.join("\n");
  }

  function messageFor(order) {
    return order.fulfilment === "Dine-in"
      ? "Pre-order for dine-in"
      : "Pickup order";
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

  function confirmationActions(order, submitted) {
    var text = orderText(order);
    var email = (ordering.email || (cfg.restaurant && cfg.restaurant.email) || "").trim();
    var mailLink = email
      ? window.FormUtils.mailto(email, "Epicuria order " + order.reference, text)
      : "";
    var waLink = ordering.whatsapp ? window.FormUtils.whatsapp(ordering.whatsapp, text) : "";

    var wrap = document.createElement("div");
    wrap.className = "confirmation";

    var icon = document.createElement("div");
    icon.className = "confirmation__icon";
    icon.innerHTML = window.Epicuria.icons.check;
    wrap.appendChild(icon);

    var heading = document.createElement("h2");
    heading.textContent = submitted ? "Order request received" : "Your order is ready to send";
    wrap.appendChild(heading);

    var ref = document.createElement("span");
    ref.className = "confirmation__ref";
    ref.textContent = "Reference " + order.reference;
    wrap.appendChild(ref);

    var copy = document.createElement("p");
    copy.className = "muted";
    copy.textContent = submitted
      ? "Thank you, " + order.customer.name + ". We will confirm your order by phone or email shortly. Keep this reference handy."
      : "Your cart is saved. Send the order to the restaurant by email" + (waLink ? " or WhatsApp" : "") + ", or copy the details. Nothing has been charged.";
    wrap.appendChild(copy);

    var details = document.createElement("div");
    details.className = "summary-row";
    var label = document.createElement("span");
    label.textContent = order.fulfilment + " · " + window.FormUtils.formatDate(order.date) + " · " + window.FormUtils.formatTime(order.time);
    details.appendChild(label);
    var total = document.createElement("strong");
    total.textContent = window.Epicuria.money(order.subtotal);
    details.appendChild(total);
    wrap.appendChild(details);

    var actions = document.createElement("div");
    actions.className = "confirmation__actions";

    if (!submitted) {
      if (mailLink) {
        var emailButton = document.createElement("a");
        emailButton.className = "btn btn--gold";
        emailButton.href = mailLink;
        emailButton.textContent = "Email order";
        actions.appendChild(emailButton);
      }
      if (waLink) {
        var waButton = document.createElement("a");
        waButton.className = "btn btn--ghost";
        waButton.href = waLink;
        waButton.target = "_blank";
        waButton.rel = "noopener";
        waButton.textContent = "WhatsApp order";
        actions.appendChild(waButton);
      }
    }

    var copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "btn btn--ghost";
    copyButton.textContent = "Copy details";
    copyButton.addEventListener("click", function () {
      window.FormUtils.copy(text).then(
        function () { window.Epicuria.toast("Order details copied."); },
        function () { window.Epicuria.toast("Could not copy automatically. Select the text to copy.", { type: "error" }); }
      );
    });
    actions.appendChild(copyButton);

    var printButton = document.createElement("button");
    printButton.type = "button";
    printButton.className = "btn btn--ghost";
    printButton.textContent = "Print";
    printButton.addEventListener("click", function () { window.print(); });
    actions.appendChild(printButton);

    if (!submitted) {
      var clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "btn btn--outline";
      clearButton.textContent = "Clear cart";
      clearButton.addEventListener("click", function () {
        window.Cart.clear();
        window.Epicuria.toast("Cart cleared.");
        window.location.href = "menu.html";
      });
      actions.appendChild(clearButton);
    }

    wrap.appendChild(actions);
    return wrap;
  }

  function showConfirmation(order, submitted) {
    if (!successNode) return;
    successNode.innerHTML = "";
    successNode.appendChild(confirmationActions(order, submitted));
    successNode.hidden = false;
    if (contentNode) contentNode.hidden = true;
    successNode.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("input", function (event) {
    if (event.target.matches("input, select, textarea")) {
      window.FormUtils.clearError(event.target);
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validate()) {
      showStatus("Please check the highlighted fields and try again.", "error");
      return;
    }

    var order = buildOrder();
    showStatus("Sending your order…", "success");
    submitButton.disabled = true;
    submitButton.classList.add("btn--loading");

    try {
      window.localStorage.setItem("epicuria.last-order", JSON.stringify(order));
    } catch (error) {
      /* storage is optional */
    }

    if (ordering.endpoint) {
      window.FormUtils.postJSON(ordering.endpoint, {
        _subject: "Epicuria order " + order.reference,
        type: "order",
        order: order
      })
        .then(function () {
          submitButton.disabled = false;
          submitButton.classList.remove("btn--loading");
          window.Cart.clear();
          showConfirmation(order, true);
        })
        .catch(function () {
          submitButton.disabled = false;
          submitButton.classList.remove("btn--loading");
          showStatus(
            "We could not send the order automatically. Use the email option below, or call the restaurant.",
            "error"
          );
          showConfirmation(order, false);
        });
    } else {
      submitButton.disabled = false;
      submitButton.classList.remove("btn--loading");
      showConfirmation(order, false);
    }
  });

  renderSummary();
  setConstraintDefaults();
})();
