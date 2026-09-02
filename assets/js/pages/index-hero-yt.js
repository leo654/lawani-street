/* Index hero YouTube Music toggle */
(function () {
  var player = null;
  var playerReady = false;
  var mutedStorageKey = "homeHeroMuted";
  var desiredMuted = false;

  function init() {
    if (!document.body.classList.contains("home-index")) return;

    var wrap = document.querySelector(".home-hero__nowplaying");
    var button = document.querySelector("[data-hero-audio-toggle]");
    var label = document.querySelector("[data-hero-audio-label]");
    var muteButton = document.querySelector("[data-hero-audio-mute]");
    var muteLabel = document.querySelector("[data-hero-audio-mute-label]");
    var metaWrap = document.querySelector(".home-hero__track-meta");
    var titleNode = document.querySelector(".home-hero__track-title");
    var artistNode = document.querySelector(".home-hero__track-artist");
    var mount = document.querySelector("[data-hero-yt-player]");
    if (!wrap || !button || !mount) return;

    wrap.dataset.playing = "false";
    wrap.dataset.progress = "0";
    window.__homeHeroAudioProgress = 0;

    var progressCircle = button.querySelector("[data-hero-progress]");
    var progressCircumference = 0;
    var progressRaf = 0;
    var lastProgressBucket = -1;

    if (progressCircle) {
      var r = parseFloat(progressCircle.getAttribute("r")) || 46;
      progressCircumference = 2 * Math.PI * r;
      progressCircle.style.strokeDasharray = progressCircumference.toFixed(2);
      progressCircle.style.strokeDashoffset = progressCircumference.toFixed(2);
    }

    function setProgress(value) {
      if (!progressCircle || !progressCircumference) return;
      var clamped = Math.max(0, Math.min(1, value || 0));
      progressCircle.style.strokeDashoffset = (progressCircumference * (1 - clamped)).toFixed(2);
    }

    function setProgressShared(value) {
      var clamped = Math.max(0, Math.min(1, value || 0));
      window.__homeHeroAudioProgress = clamped;
      var bucket = Math.round(clamped * 1000);
      if (bucket !== lastProgressBucket) {
        lastProgressBucket = bucket;
        wrap.dataset.progress = (bucket / 1000).toFixed(3);
      }
    }

    function updateProgressOnce() {
      if (!player || !playerReady) return;
      if (typeof player.getDuration !== "function" || typeof player.getCurrentTime !== "function") return;
      var duration = player.getDuration();
      if (!duration || !Number.isFinite(duration) || duration <= 0) return;
      var current = player.getCurrentTime();
      if (!Number.isFinite(current)) return;
      var next = current / duration;
      setProgress(next);
      setProgressShared(next);
    }

    function stopProgressLoop() {
      if (!progressRaf) return;
      cancelAnimationFrame(progressRaf);
      progressRaf = 0;
    }

    function startProgressLoop() {
      if (progressRaf) return;
      progressRaf = requestAnimationFrame(function tick() {
        progressRaf = requestAnimationFrame(tick);
        updateProgressOnce();
      });
    }

    function setState(isPlaying) {
      button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      button.dataset.state = isPlaying ? "playing" : "paused";
      wrap.dataset.playing = isPlaying ? "true" : "false";
      if (label) label.textContent = isPlaying ? "Pause" : "Play";
      if (isPlaying) {
        startProgressLoop();
      } else {
        stopProgressLoop();
        updateProgressOnce();
      }
    }

    setState(false);

    try {
      desiredMuted = window.localStorage && window.localStorage.getItem(mutedStorageKey) === "1";
    } catch (e) {
      desiredMuted = false;
    }

    function setMuted(isMuted) {
      if (!muteButton) return;
      muteButton.setAttribute("aria-pressed", isMuted ? "true" : "false");
      muteButton.dataset.state = isMuted ? "muted" : "unmuted";
      wrap.dataset.muted = isMuted ? "true" : "false";
      if (muteLabel) muteLabel.textContent = isMuted ? "Unmute" : "Mute";
    }

    setMuted(desiredMuted);

    function normalizeAuthor(author) {
      return (author || "").replace(/\s+-\s+Topic\s*$/i, "").trim();
    }

    function updateMetaFromPlayer() {
      if (metaWrap && metaWrap.getAttribute("data-hero-meta-static") === "1") return;
      if (!player || !playerReady) return;
      if (typeof player.getVideoData !== "function") return;
      var data = player.getVideoData();
      if (!data) return;
      var title = (data.title || "").trim();
      var author = normalizeAuthor((data.author || "").trim());
      if (titleNode && title) titleNode.textContent = title;
      if (artistNode && author) artistNode.textContent = author;
    }

    function ensureApi(callback) {
      if (window.YT && window.YT.Player) {
        callback();
        return;
      }

      if (!document.querySelector("script[data-yt-iframe-api]")) {
        var tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.defer = true;
        tag.dataset.ytIframeApi = "1";
        tag.onerror = function () {
          var fallback = document.querySelector("[data-hero-yt-fallback]");
          if (fallback) fallback.classList.add("is-visible");
        };
        document.head.appendChild(tag);
      }

      var previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousReady === "function") previousReady();
        callback();
      };
    }

    function createPlayer() {
      if (player) return;
      var listId = mount.getAttribute("data-list-id");
      var videoId = mount.getAttribute("data-video-id") || "";
      var origin = "";
      try {
        origin = window.location.origin || "";
      } catch (e) {
        origin = "";
      }

      var playerVars = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      };

      if (/^https?:\/\//.test(origin)) {
        playerVars.origin = origin;
      }

      if (listId) {
        playerVars.listType = "playlist";
        playerVars.list = listId;
      }

      player = new window.YT.Player(mount, {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: playerVars,
        events: {
          onReady: function () {
            playerReady = true;
            var fallback = document.querySelector("[data-hero-yt-fallback]");
            if (fallback) fallback.classList.remove("is-visible");
            if (listId && !videoId) {
              player.cuePlaylist({ listType: "playlist", list: listId });
            }
            if (desiredMuted) {
              player.mute();
            } else {
              player.unMute();
            }
            if (typeof player.isMuted === "function") {
              setMuted(player.isMuted());
            }
            updateMetaFromPlayer();
          },
          onStateChange: function (event) {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setState(true);
              updateMetaFromPlayer();
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setState(false);
            }
          },
          onError: function () {
            setState(false);
            var fallback = document.querySelector("[data-hero-yt-fallback]");
            if (fallback) fallback.classList.add("is-visible");
          }
        }
      });
    }

    button.addEventListener("click", function () {
      ensureApi(function () {
        createPlayer();
        if (!playerReady) return;
        var state = player.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) {
          player.pauseVideo();
          setState(false);
        } else {
          player.playVideo();
        }
      });
    });

    if (muteButton) {
      muteButton.addEventListener("click", function () {
        desiredMuted = !desiredMuted;
        setMuted(desiredMuted);
        try {
          if (window.localStorage) window.localStorage.setItem(mutedStorageKey, desiredMuted ? "1" : "0");
        } catch (e) {}

        ensureApi(function () {
          createPlayer();
          if (!playerReady) return;
          if (desiredMuted) {
            player.mute();
          } else {
            player.unMute();
          }
        });
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && player && playerReady) {
        stopProgressLoop();
        player.pauseVideo();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
