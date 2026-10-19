// Copy buttons, install tabs, clips that play only while on screen, and the latest version from GitHub.
(() => {
  const status = document.querySelector("[data-status]");
  const announce = (text) => { if (status) { status.textContent = ""; setTimeout(() => { status.textContent = text; }, 50); } };

  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = "Copied";
        button.dataset.done = "";
        announce("Copied to clipboard");
        setTimeout(() => { button.textContent = "Copy"; delete button.dataset.done; }, 1600);
      } catch {
        // Clipboard blocked: select the command so it can be copied by hand.
        getSelection().selectAllChildren(button.parentElement.querySelector("code"));
      }
    });
  }

  for (const box of document.querySelectorAll("[data-tabs]")) {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      }
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        const next = tabs[(i + step + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }

  // Each clip has a dark and a light recording, on the page's own background. WebKit ignores
  // <source media> on video, so the right one is picked here; without JS, the dark one plays.
  const light = matchMedia("(prefers-color-scheme: light)");
  const videos = [...document.querySelectorAll("video[data-autoplay]")];
  const pick = () => {
    for (const v of videos) {
      v.dataset.posterDark ??= v.getAttribute("poster");
      v.dataset.srcDark ??= v.querySelector("source").getAttribute("src");
      const src = light.matches ? v.dataset.srcLight : v.dataset.srcDark;
      if ((v.getAttribute("src") ?? v.dataset.srcDark) === src) continue;
      const playing = !v.paused;
      v.poster = light.matches ? v.dataset.posterLight : v.dataset.posterDark;
      v.src = src;
      if (playing) v.play().catch(() => {});
    }
  };
  pick();
  light.addEventListener("change", pick);

  const still = matchMedia("(prefers-reduced-motion: reduce)");
  if (still.matches || !("IntersectionObserver" in window)) {
    // Posters stay up; controls let people play a clip if they want to.
    for (const v of videos) { v.pause(); v.removeAttribute("autoplay"); v.controls = true; }
  } else {
    // Autoplay refused (Low Power Mode, data saver): native controls take over from the toggle.
    // A pause() racing play() (fast scrolling) rejects with AbortError: that one is fine.
    const play = (v) => v.play().catch((e) => {
      if (e.name !== "NotAllowedError") return;
      v.controls = true;
      v.parentElement.querySelector(".clip-toggle")?.remove();
    });

    // Looping clips need a way to stop them (WCAG 2.2.2); a paused clip stays paused.
    const PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.8" height="9" rx=".6"/><rect x="7.2" y="1.5" width="2.8" height="9" rx=".6"/></svg>';
    const PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z"/></svg>';
    for (const v of videos) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "clip-toggle";
      const render = () => {
        const held = "held" in v.dataset;
        toggle.classList.toggle("held", held);
        toggle.setAttribute("aria-label", held ? "Play clip" : "Pause clip");
        toggle.innerHTML = held ? PLAY : PAUSE;
      };
      toggle.addEventListener("click", () => {
        if ("held" in v.dataset) { delete v.dataset.held; if ("inView" in v.dataset) play(v); } else { v.dataset.held = ""; v.pause(); }
        render();
      });
      render();
      // Tell the six toggles apart: each is described by its clip's caption.
      const caption = v.closest("figure")?.querySelector("figcaption");
      if (caption) { caption.id ||= `clip-${videos.indexOf(v)}`; toggle.setAttribute("aria-describedby", caption.id); }
      v.parentElement.classList.add("has-toggle");
      v.after(toggle);
    }

    const seen = new IntersectionObserver((entries) => {
      for (const { target: v, isIntersecting } of entries) {
        if (isIntersecting) v.dataset.inView = ""; else delete v.dataset.inView;
        if ("held" in v.dataset) continue;
        if (isIntersecting) {
          v.preload = "auto";
          play(v);
        } else {
          v.pause();
        }
      }
    }, { rootMargin: "120px 0px", threshold: 0.2 });
    for (const v of videos) seen.observe(v);
  }

  fetch("https://api.github.com/repos/adrianfernandezalv/portent-releases/releases/latest")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((release) => {
      const version = release.tag_name.replace(/^v/, "");
      const dmg = release.assets.find((a) => a.name === "Portent.dmg")
        || release.assets.find((a) => /^Portent-.*\.dmg$/.test(a.name));
      for (const el of document.querySelectorAll("[data-version]")) el.textContent = `v${version}`;
      // The release workflow rewrites the pill; until that lands, point it at the newer release.
      const pill = document.querySelector("[data-release]");
      if (pill && pill.dataset.release !== version) {
        pill.href = release.html_url;
        pill.querySelector(".pill-tag").textContent = `New in ${version}`;
        pill.querySelector(".pill-text").textContent = "See what's new";
      }
      if (!dmg) return;
      for (const a of document.querySelectorAll("a[data-dmg]")) a.href = dmg.browser_download_url;
      for (const el of document.querySelectorAll("[data-dmg-name]")) {
        el.textContent = `${dmg.name} · ${(dmg.size / 1e6).toFixed(1)} MB`;
      }
    })
    .catch(() => {});
})();
