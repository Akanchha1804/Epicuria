/* Epicuria — shared dish card UI */
(function () {
  "use strict";

  function varietyClass(variety) {
    var value = String(variety || "").toLowerCase();
    if (value === "non-veg") return "dish-badge--nonveg";
    if (value === "vegan") return "dish-badge--vegan";
    return "";
  }

  function cuisineOf(item) {
    return item.cuisine || "Kitchen";
  }

  function typeOf(item) {
    return (item.types && item.types[0]) || (item.meals && item.meals[0]) || "Signature";
  }

  function dishCard(item, options) {
    options = options || {};
    var card = document.createElement("article");
    card.className = "dish-card";
    card.setAttribute("data-dish-id", String(item.id));

    var media = document.createElement("div");
    media.className = "dish-card__media";

    var image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;
    image.width = 720;
    image.height = 720;
    image.loading = options.eager ? "eager" : "lazy";
    image.decoding = "async";
    media.appendChild(image);

    var badge = document.createElement("span");
    badge.className = "dish-badge " + varietyClass(item.variety);
    badge.textContent = item.variety || "Veg";
    media.appendChild(badge);

    card.appendChild(media);

    var body = document.createElement("div");
    body.className = "dish-card__body";

    var meta = document.createElement("div");
    meta.className = "dish-card__meta";
    var cuisine = document.createElement("span");
    cuisine.textContent = cuisineOf(item);
    var type = document.createElement("span");
    type.textContent = typeOf(item);
    meta.appendChild(cuisine);
    meta.appendChild(type);
    body.appendChild(meta);

    var heading = document.createElement("h3");
    heading.textContent = item.name;
    body.appendChild(heading);

    var desc = document.createElement("p");
    desc.className = "dish-card__desc";
    desc.textContent = item.description || "";
    body.appendChild(desc);

    var foot = document.createElement("div");
    foot.className = "dish-card__foot";

    var price = document.createElement("span");
    price.className = "price";
    price.textContent = window.Epicuria ? window.Epicuria.money(item.price) : "₹" + item.price;
    foot.appendChild(price);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--outline";
    if (options.mode === "customize") {
      button.setAttribute("data-customize-dish", String(item.id));
      button.textContent = "Customize";
    } else {
      button.setAttribute("data-add-dish", String(item.id));
      button.textContent = "Add to cart";
    }
    foot.appendChild(button);

    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function getItem(id) {
    var menu = window.EPICURIA_MENU || [];
    return menu.find(function (item) { return item.id === Number(id); }) || null;
  }

  function emptyState(title, copy, actionLabel, actionAttribute) {
    var wrap = document.createElement("div");
    wrap.className = "empty-state";

    var icon = document.createElement("div");
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 11h16M5 11a7 7 0 0 1 14 0M6 11v5a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-5M9 7c0-1.5 1-2 1.5-3M13.5 7c0-1.5 1-2 1.5-3"/></svg>';
    wrap.appendChild(icon.firstChild);

    var heading = document.createElement("h3");
    heading.textContent = title;
    wrap.appendChild(heading);

    var paragraph = document.createElement("p");
    paragraph.textContent = copy;
    wrap.appendChild(paragraph);

    if (actionLabel) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn--outline";
      if (actionAttribute) {
        var parts = actionAttribute.split("=");
        button.setAttribute(parts[0], parts.slice(1).join("="));
      }
      button.textContent = actionLabel;
      wrap.appendChild(button);
    }

    return wrap;
  }

  window.EpicuriaUI = {
    dishCard: dishCard,
    getItem: getItem,
    emptyState: emptyState,
    varietyClass: varietyClass
  };
})();
