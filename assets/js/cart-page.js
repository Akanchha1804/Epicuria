/* Epicuria — cart page */
(function () {
  "use strict";

  var linesRoot = document.querySelector("[data-cart-lines]");
  if (!linesRoot || !window.Cart) return;

  var emptyState = document.querySelector("[data-cart-empty]");
  var content = document.querySelector("[data-cart-content]");
  var subtotalNode = document.querySelector("[data-cart-subtotal]");
  var countNode = document.querySelector("[data-cart-count-label]");
  var clearButton = document.querySelector("[data-cart-clear]");
  var dialog = document.getElementById("clear-cart-dialog");

  function line(item) {
    var row = document.createElement("article");
    row.className = "cart-line";
    row.setAttribute("data-key", item.key);

    var media = document.createElement("div");
    media.className = "cart-line__media";
    if (item.image) {
      var image = document.createElement("img");
      image.src = item.image;
      image.alt = item.name;
      image.loading = "lazy";
      image.width = 92;
      image.height = 92;
      media.appendChild(image);
    }
    row.appendChild(media);

    var info = document.createElement("div");
    info.className = "cart-line__info";
    var heading = document.createElement("h3");
    heading.textContent = item.name;
    info.appendChild(heading);
    var unit = document.createElement("p");
    unit.textContent = window.Epicuria.money(item.price) + " each";
    info.appendChild(unit);

    if (item.customizations) {
      var custom = document.createElement("p");
      custom.className = "cart-line__custom";
      var bits = [];
      if (item.customizations.excluded && item.customizations.excluded.length) {
        bits.push("Without " + item.customizations.excluded.join(", "));
      }
      if (item.customizations.note) bits.push("Note: " + item.customizations.note);
      custom.textContent = bits.join(" · ");
      info.appendChild(custom);
    }
    row.appendChild(info);

    var controls = document.createElement("div");
    controls.className = "cart-line__controls";

    var qty = document.createElement("div");
    qty.className = "qty";
    var dec = document.createElement("button");
    dec.type = "button";
    dec.setAttribute("data-qty", "dec");
    dec.setAttribute("aria-label", "Decrease quantity of " + item.name);
    dec.disabled = item.qty <= 1;
    dec.textContent = "−";
    var value = document.createElement("span");
    value.textContent = String(item.qty);
    value.setAttribute("aria-live", "polite");
    var inc = document.createElement("button");
    inc.type = "button";
    inc.setAttribute("data-qty", "inc");
    inc.setAttribute("aria-label", "Increase quantity of " + item.name);
    inc.textContent = "+";
    qty.appendChild(dec);
    qty.appendChild(value);
    qty.appendChild(inc);
    controls.appendChild(qty);

    var price = document.createElement("strong");
    price.className = "cart-line__price";
    price.textContent = window.Epicuria.money(item.price * item.qty);
    controls.appendChild(price);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.setAttribute("data-remove", "");
    remove.textContent = "Remove";
    controls.appendChild(remove);

    row.appendChild(controls);
    return row;
  }

  function render() {
    var items = window.Cart.items();
    var count = window.Cart.count();
    var subtotal = window.Cart.subtotal();

    if (!items.length) {
      if (emptyState) emptyState.hidden = false;
      if (content) content.hidden = true;
      linesRoot.innerHTML = "";
      return;
    }

    if (emptyState) emptyState.hidden = true;
    if (content) content.hidden = false;

    linesRoot.innerHTML = "";
    items.forEach(function (item) {
      linesRoot.appendChild(line(item));
    });

    if (subtotalNode) subtotalNode.textContent = window.Epicuria.money(subtotal);
    if (countNode) countNode.textContent = count + (count === 1 ? " item" : " items");
  }

  linesRoot.addEventListener("click", function (event) {
    var row = event.target.closest("[data-key]");
    if (!row) return;
    var key = row.getAttribute("data-key");

    if (event.target.closest("[data-remove]")) {
      var item = window.Cart.items().find(function (entry) { return entry.key === key; });
      window.Cart.remove(key);
      if (item) window.Epicuria.toast(item.name + " removed from your cart.");
      return;
    }

    var qtyButton = event.target.closest("[data-qty]");
    if (!qtyButton) return;
    var current = window.Cart.items().find(function (entry) { return entry.key === key; });
    if (!current) return;
    if (qtyButton.getAttribute("data-qty") === "inc") {
      window.Cart.setQty(key, current.qty + 1);
    } else {
      window.Cart.setQty(key, current.qty - 1);
    }
  });

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
      else if (window.confirm("Remove every item from your cart?")) window.Cart.clear();
    });
  }

  if (dialog) {
    var confirmButton = dialog.querySelector("[data-confirm-clear]");
    if (confirmButton) {
      confirmButton.addEventListener("click", function () {
        window.Cart.clear();
        dialog.close();
        window.Epicuria.toast("Your cart is now empty.");
      });
    }
  }

  window.Cart.onChange(render);
  render();
})();
