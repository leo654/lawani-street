(function () {
  "use strict";

  function ready() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var notice = document.querySelector("[data-linkedin-notice]");

    if (notice) {
      var card = notice.querySelector(".ll-linkedin-notice__card");
      var image = notice.querySelector("[data-linkedin-post-image]");
      var title = notice.querySelector("[data-linkedin-post-title]");
      var copy = notice.querySelector("[data-linkedin-post-copy]");
      var count = notice.querySelector("[data-linkedin-post-count]");
      var slide = notice.closest("[data-deck-slide]");
      var posts = [
        { title: "Thinking out loud", copy: "Good work starts with a useful question, not a decorative answer.", image: "assets/img/snap.jpg" },
        { title: "Make the system sing", copy: "Consistency is not repetition. It is giving every decision a shared point of view.", image: "assets/img/kj2.png" },
        { title: "Design for the second look", copy: "The first moment gets attention. The second one earns trust.", image: "assets/img/ademi1.png" },
        { title: "Start where people are", copy: "Strategy is empathy with a sharper pencil.", image: "assets/img/tyol1.png" },
        { title: "Keep the rough edges", copy: "The best brands leave enough room for people to feel something back.", image: "assets/img/bpm2.png" }
      ];
      var postIndex = 0;
      var timer = 0;

      function active() { return !slide || slide.classList.contains("is-active"); }
      function showPost(index) {
        postIndex = index % posts.length;
        var post = posts[postIndex];
        if (card) card.classList.add("is-changing");
        window.setTimeout(function () {
          if (title) title.textContent = post.title;
          if (copy) copy.textContent = post.copy;
          if (image) image.src = post.image;
          if (count) count.textContent = String(postIndex + 1).padStart(2, "0") + " / " + String(posts.length).padStart(2, "0");
        }, reduceMotion.matches ? 0 : 230);
        window.setTimeout(function () { if (card) card.classList.remove("is-changing"); }, reduceMotion.matches ? 0 : 560);
      }
      function cycle() {
        window.clearInterval(timer);
        if (reduceMotion.matches) return;
        timer = window.setInterval(function () { if (active()) showPost(postIndex + 1); }, 4100);
      }
      showPost(0);
      cycle();
      document.addEventListener("visibilitychange", function () { if (document.hidden) window.clearInterval(timer); else cycle(); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
