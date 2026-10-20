/* Epicuria — taste board / dietary customisation */
(function () {
  "use strict";

  var grid = document.querySelector("[data-board-grid]");
  if (!grid) return;

  var menu = window.EPICURIA_MENU || [];
  var state = { search: "", facets: {}, shown: 24 };
  var PAGE_SIZE = 24;

  var searchInput = document.querySelector("[data-board-search]");
  var filtersRoot = document.querySelector("[data-board-filters]");
  var countNode = document.querySelector("[data-board-count]");
  var loadMore = document.querySelector("[data-board-load-more]");
  var clearButton = document.querySelector("[data-board-clear]");
  var dialog = document.getElementById("customize-dialog");
  var currentItem = null;

  var FACETS = [
    { key: "cuisine", label: "Cuisine" },
    { key: "variety", label: "Diet" },
    { key: "meals", label: "Meal" },
    { key: "tastes", label: "Taste" },
    { key: "types", label: "Dish type" },
    { key: "dineTypes", label: "Dining style" }
  ];

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function facetValues(key) {
    if (key === "cuisine" || key === "variety") {
      return unique(menu.map(function (item) { return item[key]; }));
    }
    var values = [];
    menu.forEach(function (item) {
      (item[key] || []).forEach(function (value) { values.push(value); });
    });
    return unique(values).sort();
  }

  function buildFilters() {
    if (!filtersRoot) return;
    filtersRoot.innerHTML = "";
    FACETS.forEach(function (facet) {
      var values = facetValues(facet.key);
      if (!values.length) return;

      var group = document.createElement("div");
      group.className = "filter-group";

      var heading = document.createElement("h3");
      heading.textContent = facet.label;
      group.appendChild(heading);

      var options = document.createElement("div");
      options.className = "filter-options";
      options.setAttribute("role", "group");
      options.setAttribute("aria-label", facet.label);

      values.forEach(function (value) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "chip";
        button.textContent = value;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function () {
          if (state.facets[facet.key] === value) {
            delete state.facets[facet.key];
            button.setAttribute("aria-pressed", "false");
          } else {
            state.facets[facet.key] = value;
            options.querySelectorAll(".chip").forEach(function (chip) {
              chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
            });
          }
          state.shown = PAGE_SIZE;
          render();
        });
        options.appendChild(button);
      });

      group.appendChild(options);
      filtersRoot.appendChild(group);
    });
  }

  function matches(item) {
    var facetKeys = Object.keys(state.facets);
    for (var i = 0; i < facetKeys.length; i += 1) {
      var key = facetKeys[i];
      var wanted = state.facets[key];
      var itemValue = item[key];
      if (Array.isArray(itemValue)) {
        if (itemValue.indexOf(wanted) === -1) return false;
      } else if (itemValue !== wanted) {
        return false;
      }
    }

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
      grid.appendChild(
        window.EpicuriaUI.emptyState(
          "Nothing on the board yet",
          "Loosen a filter or search for another ingredient.",
          "Reset the board",
          "data-board-reset"
        )
      );
    } else {
      filtered.slice(0, state.shown).forEach(function (item) {
        grid.appendChild(window.EpicuriaUI.dishCard(item, { mode: "customize" }));
      });
    }

    if (countNode) {
      countNode.innerHTML =
        "Showing <strong>" + Math.min(state.shown, filtered.length) + "</strong> of <strong>" + filtered.length + "</strong> dishes";
    }

    if (loadMore) {
      loadMore.hidden = filtered.length <= state.shown;
    }
  }

  function reset() {
    state = { search: "", facets: {}, shown: PAGE_SIZE };
    if (searchInput) searchInput.value = "";
    if (filtersRoot) {
      filtersRoot.querySelectorAll(".chip").forEach(function (chip) {
        chip.setAttribute("aria-pressed", "false");
      });
    }
    render();
  }

  function openCustomizer(item) {
    if (!dialog || !item) return;
    currentItem = item;

    dialog.querySelector("[data-dialog-title]").textContent = item.name;
    dialog.querySelector("[data-dialog-meta]").textContent = item.cuisine + " · " + item.variety + " · " + item.types.slice(0, 2).join(", ");
    dialog.querySelector("[data-dialog-desc]").textContent = item.description;
    dialog.querySelector("[data-dialog-mandatory]").textContent =
      "Always included: " + (item.mandatory.length ? item.mandatory.join(", ") : "chef's selection");
    dialog.querySelector("[data-dialog-price]").textContent = window.Epicuria.money(item.price);
    dialog.querySelector("[data-dialog-note]").value = "";

    var image = dialog.querySelector("[data-dialog-image]");
    image.src = item.image;
    image.alt = item.name;

    var list = dialog.querySelector("[data-dialog-negotiable]");
    list.innerHTML = "";

    if (item.negotiable.length) {
      item.negotiable.forEach(function (ingredient) {
        var label = document.createElement("label");
        var input = document.createElement("input");
        input.type = "checkbox";
        input.value = ingredient;
        input.checked = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(ingredient));
        list.appendChild(label);
      });
    } else {
      var note = document.createElement("p");
      note.className = "small muted";
      note.textContent = "This dish has no negotiable ingredients — add a note for the kitchen instead.";
      list.appendChild(note);
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
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

  if (clearButton) clearButton.addEventListener("click", reset);

  if (loadMore) {
    loadMore.addEventListener("click", function () {
      state.shown += PAGE_SIZE;
      render();
    });
  }

  grid.addEventListener("click", function (event) {
    if (event.target.closest("[data-board-reset]")) {
      reset();
      return;
    }
    var button = event.target.closest("[data-customize-dish]");
    if (!button) return;
    openCustomizer(window.EpicuriaUI.getItem(button.getAttribute("data-customize-dish")));
  });

  if (dialog) {
    dialog.querySelector("[data-dialog-add]").addEventListener("click", function () {
      if (!currentItem) return;
      var excluded = Array.prototype.slice
        .call(dialog.querySelectorAll("[data-dialog-negotiable] input:not(:checked)"))
        .map(function (input) { return input.value; });
      var note = dialog.querySelector("[data-dialog-note]").value.trim();

      var added = window.Cart.add(
        {
          id: currentItem.id,
          name: currentItem.name,
          price: currentItem.price,
          image: currentItem.image,
          customizations: { excluded: excluded, note: note }
        },
        1
      );

      if (!added) {
        window.Epicuria.toast("That dish could not be added. Please try again.", { type: "error" });
        return;
      }

      var detail = [];
      if (excluded.length) detail.push("without " + excluded.join(", "));
      if (note) detail.push("note added");
      window.Epicuria.toast(
        currentItem.name + " added" + (detail.length ? " (" + detail.join("; ") + ")" : "") + ".",
        { action: { href: "cart.html", label: "View cart" } }
      );
      dialog.close();
    });
  }

  buildFilters();
  render();
})();
