/* Epicuria — menu page */
(function () {
  "use strict";

  var grid = document.querySelector("[data-menu-grid]");
  if (!grid) return;

  var menu = window.EPICURIA_MENU || [];
  var state = { search: "", cuisine: "All", variety: "All", shown: 24 };
  var PAGE_SIZE = 24;

  var searchInput = document.querySelector("[data-menu-search]");
  var cuisineRail = document.querySelector("[data-cuisine-filters]");
  var varietySelect = document.querySelector("[data-variety-filter]");
  var countNode = document.querySelector("[data-result-count]");
  var loadMore = document.querySelector("[data-load-more]");

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function buildCuisineFilters() {
    if (!cuisineRail) return;
    var cuisines = unique(menu.map(function (item) { return item.cuisine; }));
    var all = ["All"].concat(cuisines);
    cuisineRail.innerHTML = "";
    all.forEach(function (cuisine) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.textContent = cuisine;
      button.setAttribute("aria-pressed", cuisine === state.cuisine ? "true" : "false");
      button.addEventListener("click", function () {
        state.cuisine = cuisine;
        state.shown = PAGE_SIZE;
        cuisineRail.querySelectorAll(".chip").forEach(function (chip) {
          chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
        });
        render();
      });
      cuisineRail.appendChild(button);
    });
  }

  function matches(item) {
    if (state.cuisine !== "All" && item.cuisine !== state.cuisine) return false;
    if (state.variety !== "All" && item.variety !== state.variety) return false;
    if (!state.search) return true;
    var haystack = [
      item.name,
      item.description,
      item.cuisine,
      item.variety
    ]
      .concat(item.tastes || [])
      .concat(item.meals || [])
      .concat(item.types || [])
      .concat(item.dineTypes || [])
      .concat(item.mandatory || [])
      .concat(item.negotiable || [])
      .join(" ")
      .toLowerCase();
    return haystack.indexOf(state.search) !== -1;
  }

  function render() {
    var filtered = menu.filter(matches);
    grid.innerHTML = "";

    if (!filtered.length) {
      var empty = window.EpicuriaUI.emptyState(
        "No dishes match that search",
        "Try a different cuisine, dish name or ingredient.",
        "Clear filters",
        "data-clear-filters"
      );
      grid.appendChild(empty);
    } else {
      var visible = filtered.slice(0, state.shown);
      visible.forEach(function (item) {
        grid.appendChild(window.EpicuriaUI.dishCard(item));
      });
    }

    if (countNode) {
      var count = filtered.length;
      countNode.innerHTML =
        count === 0
          ? "<strong>0</strong> dishes"
          : "<strong>" + Math.min(state.shown, count) + "</strong> of <strong>" + count + "</strong> " + (count === 1 ? "dish" : "dishes");
    }

    if (loadMore) {
      loadMore.hidden = filtered.length <= state.shown;
      if (!loadMore.hidden) {
        loadMore.querySelector("span").textContent = "Showing " + state.shown + " of " + filtered.length;
      }
    }
  }

  function clearFilters() {
    state = { search: "", cuisine: "All", variety: "All", shown: PAGE_SIZE };
    if (searchInput) searchInput.value = "";
    if (varietySelect) varietySelect.value = "All";
    if (cuisineRail) {
      cuisineRail.querySelectorAll(".chip").forEach(function (chip) {
        chip.setAttribute("aria-pressed", chip.textContent === "All" ? "true" : "false");
      });
    }
    render();
  }

  if (searchInput) {
    var handleSearch = window.Epicuria.debounce(function () {
      state.search = searchInput.value.trim().toLowerCase();
      state.shown = PAGE_SIZE;
      render();
    }, 140);
    searchInput.addEventListener("input", handleSearch);
    searchInput.addEventListener("search", handleSearch);
  }

  if (varietySelect) {
    varietySelect.addEventListener("change", function () {
      state.variety = varietySelect.value;
      state.shown = PAGE_SIZE;
      render();
    });
  }

  if (loadMore) {
    loadMore.addEventListener("click", function () {
      state.shown += PAGE_SIZE;
      render();
    });
  }

  grid.addEventListener("click", function (event) {
    var clear = event.target.closest("[data-clear-filters]");
    if (clear) {
      clearFilters();
      return;
    }

    var button = event.target.closest("[data-add-dish]");
    if (!button) return;
    var item = window.EpicuriaUI.getItem(button.getAttribute("data-add-dish"));
    if (!item || !window.Cart) return;

    window.Cart.add(item, 1);
    var original = button.textContent;
    button.textContent = "Added ✓";
    button.disabled = true;
    window.Epicuria.toast(item.name + " added to your cart.", {
      action: { href: "cart.html", label: "View cart" }
    });
    setTimeout(function () {
      button.textContent = original;
      button.disabled = false;
    }, 1300);
  });

  var params = new URLSearchParams(window.location.search);
  var requestedCuisine = params.get("cuisine");
  if (requestedCuisine && menu.some(function (item) { return item.cuisine.toLowerCase() === requestedCuisine.toLowerCase(); })) {
    var match = menu.find(function (item) { return item.cuisine.toLowerCase() === requestedCuisine.toLowerCase(); });
    state.cuisine = match.cuisine;
  }

  buildCuisineFilters();
  render();
})();
