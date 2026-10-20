/* Epicuria — home page */
(function () {
  "use strict";

  var slideshow = document.querySelector("[data-slideshow]");
  if (slideshow) {
    var slides = Array.prototype.slice.call(slideshow.querySelectorAll(".hero-slide"));
    var dotsRoot = slideshow.querySelector("[data-hero-dots]");
    var prev = slideshow.querySelector("[data-hero-prev]");
    var next = slideshow.querySelector("[data-hero-next]");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0;
    var timer = null;

    if (slides.length > 1 && dotsRoot) {
      slides.forEach(function (slide, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-dot";
        dot.setAttribute("aria-label", "Show slide " + (i + 1) + " of " + slides.length);
        dot.setAttribute("aria-current", i === 0 ? "true" : "false");
        dot.addEventListener("click", function () {
          show(i);
          restart();
        });
        dotsRoot.appendChild(dot);
      });
    }

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      if (dotsRoot) {
        Array.prototype.forEach.call(dotsRoot.children, function (dot, i) {
          dot.setAttribute("aria-current", i === index ? "true" : "false");
        });
      }
    }

    function start() {
      if (reduced || slides.length < 2) return;
      stop();
      timer = setInterval(function () {
        show(index + 1);
      }, 6500);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function restart() {
      stop();
      start();
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    slideshow.addEventListener("pointerenter", stop);
    slideshow.addEventListener("pointerleave", start);
    slideshow.addEventListener("focusin", stop);
    slideshow.addEventListener("focusout", function (event) {
      if (!slideshow.contains(event.relatedTarget)) start();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    show(0);
    start();
  }

  var featured = document.querySelector("[data-featured-dishes]");
  if (featured) {
    var menu = window.EPICURIA_MENU || [];
    var config = window.Epicuria.config || {};
    var ids = config.featuredDishIds || [];
    var dishes = ids
      .map(function (id) { return menu.find(function (item) { return item.id === Number(id); }); })
      .filter(Boolean)
      .slice(0, 4);

    dishes.forEach(function (item, index) {
      featured.appendChild(window.EpicuriaUI.dishCard(item, { eager: index === 0 }));
    });

    featured.addEventListener("click", function (event) {
      var button = event.target.closest("[data-add-dish]");
      if (!button) return;
      var item = window.EpicuriaUI.getItem(button.getAttribute("data-add-dish"));
      if (!item) return;
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
  }
})();
