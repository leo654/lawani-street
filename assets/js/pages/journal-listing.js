(function () {
  if (!document.body.classList.contains("journal-page")) return;

  var yearButtons = Array.prototype.slice.call(document.querySelectorAll(".year-btn"));
  var listRoot = document.getElementById("journal-list");
  var paginationRoot = document.getElementById("journal-pagination");
  var cards = listRoot
    ? Array.prototype.slice.call(listRoot.querySelectorAll(".journal-card"))
    : [];

  if (!listRoot || !paginationRoot || !cards.length) return;

  var activeYear = "all";
  var currentPage = 1;
  var perPage = 4;

  function getFiltered() {
    return cards.filter(function (card) {
      return activeYear === "all" || card.getAttribute("data-year") === activeYear;
    });
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationRoot.innerHTML = "";
      return;
    }

    var pageBtns = "";
    for (var i = 1; i <= totalPages; i += 1) {
      pageBtns += '<button class="archive-page-btn' + (i === currentPage ? " is-active" : "") + '" type="button" data-page="' + i + '">' + i + "</button>";
    }

    paginationRoot.innerHTML =
      '<button class="archive-page-btn archive-page-btn--nav" type="button" data-prev="1" ' + (currentPage === 1 ? "disabled" : "") + '>Prev</button>' +
      '<div class="archive-pagination__pages">' + pageBtns + "</div>" +
      '<button class="archive-page-btn archive-page-btn--nav" type="button" data-next="1" ' + (currentPage === totalPages ? "disabled" : "") + '>Next</button>';
  }

  function render() {
    var filtered = getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * perPage;
    var visibleCards = filtered.slice(start, start + perPage);

    cards.forEach(function (card) {
      card.hidden = visibleCards.indexOf(card) === -1;
    });

    renderPagination(totalPages);

    if (typeof window.gsap !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.gsap.fromTo(
        visibleCards,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.58, ease: "power3.out", stagger: 0.05 }
      );
    }
  }

  function setYear(year) {
    activeYear = year;
    currentPage = 1;
    yearButtons.forEach(function (btn) {
      var active = btn.dataset.year === year;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    render();
  }

  yearButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setYear(btn.dataset.year || "all");
    });
  });

  paginationRoot.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.hasAttribute("data-page")) {
      currentPage = parseInt(target.getAttribute("data-page"), 10) || 1;
      render();
      return;
    }

    if (target.hasAttribute("data-prev")) {
      currentPage = Math.max(1, currentPage - 1);
      render();
      return;
    }

    if (target.hasAttribute("data-next")) {
      currentPage += 1;
      render();
    }
  });

  setYear("all");
})();
