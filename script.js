(function () {
  const cfg = window.JAAN_ANNIVERSARY || {};
  const toastEl = document.getElementById("toast");
  const letterBody = document.getElementById("letterBody");
  const letterPanel = document.getElementById("letterPanel");
  const envelopeBtn = document.getElementById("envelopeBtn");
  const timelineRoot = document.getElementById("timelineRoot");
  const memoryGrid = document.getElementById("memoryGrid");
  const daysEl = document.querySelector("[data-days]");
  const btnConfetti = document.getElementById("btnConfetti");
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  const secretInputMobile = document.getElementById("secretInputMobile");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
  }

  function parseYmd(s) {
    const [y, m, d] = (s || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function daysBetween(start, end) {
    const ms = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  function formatNiceDate(d) {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Days together + optional count-up */
  const start = parseYmd(cfg.relationshipStartDate);
  const dayCount = start ? daysBetween(start, new Date()) : null;

  function setDaysText(n) {
    if (daysEl) daysEl.textContent = String(n);
  }

  if (dayCount != null && daysEl) {
    if (prefersReducedMotion) {
      setDaysText(dayCount);
    } else {
      setDaysText(0);
      const duration = Math.min(2200, 700 + dayCount * 4);
      animateNumber(daysEl, 0, dayCount, duration);
    }
  } else if (daysEl) {
    daysEl.textContent = "∞";
  }

  function animateNumber(el, from, to, duration) {
    const t0 = performance.now();
    function frame(t) {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 2.4);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /** Letter */
  if (letterBody) {
    letterBody.innerHTML = cfg.letterHtml || "Happy anniversary, Jaan.";
  }

  /** Envelope */
  if (envelopeBtn && letterPanel) {
    envelopeBtn.addEventListener("click", () => {
      const open = envelopeBtn.classList.toggle("is-open");
      envelopeBtn.setAttribute("aria-expanded", open ? "true" : "false");
      letterPanel.hidden = !open;
      if (open) {
        showToast("For your eyes only, Jaan.");
        fireConfetti(prefersReducedMotion ? 40 : 110);
        letterPanel.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
      }
    });
  }

  /** Timeline */
  const events = (cfg.timeline || []).slice().sort((a, b) => {
    const da = parseYmd(a.date)?.getTime() || 0;
    const db = parseYmd(b.date)?.getTime() || 0;
    return da - db;
  });

  if (timelineRoot) {
    events.forEach((ev, idx) => {
      const d = parseYmd(ev.date);
      const dateStr = d ? formatNiceDate(d) : ev.date || "";
      const item = document.createElement("div");
      item.className = "tl-item";
      if (!prefersReducedMotion) {
        item.style.setProperty("--delay", `${Math.min(idx * 0.08, 0.6)}s`);
      }
      item.innerHTML = `
        <span class="tl-dot" aria-hidden="true"></span>
        <article class="tl-card">
          <div class="tl-date">${escapeHtml(dateStr)}</div>
          <h3>${escapeHtml(ev.title || "Moment")}</h3>
          <p>${escapeHtml(ev.text || "")}</p>
        </article>
      `;
      timelineRoot.appendChild(item);
    });
  }

  /** Memory flip cards */
  (cfg.memories || []).forEach((m, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "memory-card";
    btn.setAttribute("aria-pressed", "false");
    if (!prefersReducedMotion) {
      btn.style.setProperty("--delay", `${Math.min(idx * 0.06, 0.55)}s`);
    }
    btn.innerHTML = `
      <div class="memory-inner">
        <div class="memory-face memory-front">
          <span class="memory-emoji">${m.emoji || "💕"}</span>
          <span class="memory-title">${escapeHtml(m.title || "Memory")}</span>
        </div>
        <div class="memory-face memory-back">${escapeHtml(m.message || "")}</div>
      </div>
    `;
    btn.addEventListener("click", () => {
      const flipped = btn.classList.toggle("is-flipped");
      btn.setAttribute("aria-pressed", flipped ? "true" : "false");
      if (flipped) fireConfetti(prefersReducedMotion ? 18 : 38);
    });
    memoryGrid?.appendChild(btn);
  });

  /** Scroll reveals */
  const revealEls = document.querySelectorAll(".reveal, .tl-item, .memory-card");
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-inview");
            io.unobserve(en.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -48px 0px", threshold: 0.06 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-inview"));
  }

  /** Surprise: heart rain */
  document.querySelectorAll('[data-surprise="hearts"] .btn-surprise').forEach((b) => {
    b.addEventListener("click", () => {
      const count = prefersReducedMotion ? 18 : 48;
      for (let i = 0; i < count; i++) {
        setTimeout(() => spawnHeart(), i * (prefersReducedMotion ? 100 : 55));
      }
      showToast("Jaan — this heart shower has your name on it.");
    });
  });

  function spawnHeart() {
    const el = document.createElement("div");
    el.className = "floating-heart";
    el.textContent = ["💕", "💗", "💖", "✨", "🌸", "🫶"][Math.floor(Math.random() * 6)];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = "-40px";
    const drift = (Math.random() - 0.5) * 80;
    el.style.setProperty("--drift", `${drift}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  /** Sparkle zone — pointer (mouse + touch) */
  const sparkleZone = document.getElementById("sparkleZone");
  let sparkRaf = null;
  let pendingSpark = null;

  function flushSpark() {
    sparkRaf = null;
    if (!sparkleZone || !pendingSpark) return;
    const { x, y } = pendingSpark;
    pendingSpark = null;
    if (Math.random() > (prefersReducedMotion ? 0.35 : 0.5)) return;
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    sparkleZone.appendChild(s);
    setTimeout(() => s.remove(), 750);
  }

  function queueSpark(clientX, clientY) {
    if (!sparkleZone) return;
    const r = sparkleZone.getBoundingClientRect();
    pendingSpark = { x: clientX - r.left, y: clientY - r.top };
    if (!sparkRaf) sparkRaf = requestAnimationFrame(flushSpark);
  }

  if (sparkleZone) {
    sparkleZone.addEventListener("pointerdown", (e) => {
      try {
        sparkleZone.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
      queueSpark(e.clientX, e.clientY);
    });
    sparkleZone.addEventListener("pointermove", (e) => {
      if (e.pressure === 0 && e.pointerType === "mouse" && e.buttons === 0) return;
      queueSpark(e.clientX, e.clientY);
    });
    sparkleZone.addEventListener("pointerup", (e) => {
      try {
        sparkleZone.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    });
    sparkleZone.addEventListener("pointercancel", () => {
      pendingSpark = null;
    });
  }

  /** Gift triple tap */
  let giftTaps = 0;
  const giftBtn = document.getElementById("giftBtn");
  giftBtn?.addEventListener("click", () => {
    giftTaps = Math.min(3, giftTaps + 1);
    giftBtn.textContent = `Tap me (${giftTaps}/3)`;
    if (giftTaps >= 3) {
      giftTaps = 0;
      giftBtn.textContent = "Tap me (0/3)";
      showToast("Coupon: one unlimited hug. Redeem anytime. Valid forever.");
      fireConfetti(prefersReducedMotion ? 35 : 130);
    }
  });

  /** Secret phrase */
  const phrase = (cfg.secretPhrase || "jaan").toLowerCase().replace(/[^a-z]/g, "");
  let buffer = "";
  let secretTriggered = false;

  function trySecretTrigger() {
    if (secretTriggered) return;
    secretTriggered = true;
    showToast("You found the secret, Jaan. I love you a little extra right now.");
    fireConfetti(prefersReducedMotion ? 45 : 170);
    spawnHeart();
    if (secretInputMobile) secretInputMobile.value = "";
    setTimeout(() => {
      secretTriggered = false;
    }, 1200);
  }

  window.addEventListener("keydown", (e) => {
    const el = e.target;
    if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable)) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      buffer = (buffer + e.key.toLowerCase()).slice(-32);
      if (phrase && buffer.includes(phrase)) {
        buffer = "";
        trySecretTrigger();
      }
    }
  });

  secretInputMobile?.addEventListener("input", () => {
    const v = secretInputMobile.value.toLowerCase().replace(/[^a-z]/g, "");
    if (phrase && v.includes(phrase)) trySecretTrigger();
  });

  /** Confetti with DPR-aware canvas */
  let pieces = [];
  let dpr = Math.min(2, window.devicePixelRatio || 1);

  function resizeCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function fireConfetti(count) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const colors = ["#ff6b9d", "#ffa8c8", "#ffd966", "#7fdbca", "#c9b1ff", "#ffffff"];
    const n = prefersReducedMotion ? Math.min(count, 35) : count;
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.35,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vy: 2 + Math.random() * 4,
        vx: -2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.15 + Math.random() * 0.3,
        c: colors[(Math.random() * colors.length) | 0],
      });
    }
    if (!fireConfetti._raf) {
      fireConfetti._raf = requestAnimationFrame(loop);
    }
  }

  function loop() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.045;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    pieces = pieces.filter((p) => p.y < h + 90);
    if (pieces.length) {
      fireConfetti._raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(fireConfetti._raf);
      fireConfetti._raf = null;
    }
  }

  btnConfetti?.addEventListener("click", () => {
    fireConfetti(prefersReducedMotion ? 55 : 160);
    showToast("Because you make ordinary life feel like a festival.");
  });

  /** First visit micro-surprise */
  try {
    if (!sessionStorage.getItem("jaanSeen")) {
      sessionStorage.setItem("jaanSeen", "1");
      setTimeout(
        () => showToast(`Hey Jaan — ${cfg.fromName || "your favourite person"} left you something special here.`),
        prefersReducedMotion ? 400 : 900
      );
    }
  } catch (_) {
    /* ignore */
  }
})();
