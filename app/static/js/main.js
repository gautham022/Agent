/* ═══════════════════════════════════════════════════════════
   NIKA – One Piece AI Crew  |  Main JavaScript
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Agent metadata ──
  const AGENTS = {
    nami:    { name: "Nami",     role: "Maps & Navigation",  color: "#f97316", filter: "glow-orange",    icon: "fa-location-dot" },
    morgans: { name: "Morgans",  role: "Email Agent",        color: "#3b82f6", filter: "glow-blue",      icon: "fa-envelope" },
    sanji:   { name: "Sanji",    role: "Instagram Agent",    color: "#ec4899", filter: "glow-pink",      icon: "fa-brands fa-instagram" },
    robin:   { name: "Robin",    role: "News & Research",    color: "#a855f7", filter: "glow-purple",    icon: "fa-newspaper" },
    brook:   { name: "Brook",    role: "YouTube Music",      color: "#7c3aed", filter: "glow-deeppurple",icon: "fa-music" },
    shanks:  { name: "YouTube",  role: "Video Agent",        color: "#ef4444", filter: "glow-red",       icon: "fa-brands fa-youtube" },
    morco:   { name: "Morco",    role: "LinkedIn Agent",     color: "#06b6d4", filter: "glow-cyan",      icon: "fa-brands fa-linkedin-in" },
    zoro:    { name: "Zoro",     role: "To-do / Reminder",   color: "#22c55e", filter: "glow-green",     icon: "fa-solid fa-check-square" },
  };

  // ── DOM references ──
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  const constellation  = $("#constellation-container");
  const svgLines       = $("#svg-lines");
  const centerNode     = $("#nika-center");
  const commandInput   = $("#command-input");
  const voiceBtn       = $("#voice-btn");
  const toggleMicBtn   = $("#toggle-mic");
  const toggleAudioBtn = $("#toggle-audio");
  const toggleFsBtn    = $("#toggle-fullscreen");
  const modalOverlay   = $("#modal-overlay");
  const agentModal     = $("#agent-modal");
  const closeModalBtn  = $("#close-modal-btn");
  const modalAvatar    = $("#modal-agent-avatar");
  const modalName      = $("#modal-agent-name");
  const modalRole      = $("#modal-agent-role");
  const modalContent   = $("#modal-content");
  const barPrimary     = $("#bar-status-primary");
  const barSecondary   = $("#bar-status-secondary");

  let activeAgent = null;
  let audioEnabled = true;
  let commandHistory = [];

  /* ══════════════════════════════════════
     SVG CONNECTION LINES
     ══════════════════════════════════════ */
  function drawLines() {
    if (!constellation || !svgLines) return;
    svgLines.innerHTML = "";

    const cRect = constellation.getBoundingClientRect();
    const cx = cRect.width / 2;
    const cy = cRect.height / 2;

    $$(".agent-card").forEach(card => {
      const agentKey = card.dataset.agent;
      const meta = AGENTS[agentKey];
      if (!meta) return;

      const badge = $(".connector-badge", card);
      if (!badge) return;

      const bRect = badge.getBoundingClientRect();
      // Badge centre relative to constellation
      const bx = bRect.left + bRect.width / 2 - cRect.left;
      const by = bRect.top + bRect.height / 2 - cRect.top;

      const ns = "http://www.w3.org/2000/svg";

      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", cx);
      line.setAttribute("y1", cy);
      line.setAttribute("x2", bx);
      line.setAttribute("y2", by);

      // Make line style match the golden theme from the center orb
      line.setAttribute("stroke", "#f59e0b"); // Golden theme color
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-dasharray", "8 6");
      line.setAttribute("opacity", "0.7");
      // Adding a subtle glow matching the agent's color
      line.setAttribute("filter", `url(#${meta.filter})`);

      svgLines.append(line);
    });
  }

  // Redraw on resize / load
  window.addEventListener("resize", drawLines);
  window.addEventListener("load", () => setTimeout(drawLines, 100));
  // Also redraw after images load (avatars change card size)
  setTimeout(drawLines, 500);
  setTimeout(drawLines, 1500);

  /* ══════════════════════════════════════
     MODAL MANAGEMENT
     ══════════════════════════════════════ */
  function openModal(agentKey) {
    const meta = AGENTS[agentKey];
    if (!meta) return;
    activeAgent = agentKey;

    modalAvatar.src = $(`.agent-card[data-agent="${agentKey}"] .agent-avatar`).src;
    modalName.textContent = meta.name;
    modalRole.textContent = meta.role;
    modalContent.innerHTML = buildModalHTML(agentKey);
    modalOverlay.classList.remove("hidden");

    // Bind modal-specific handlers
    bindModalActions(agentKey);
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    activeAgent = null;
  }

  closeModalBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  /* ── Build modal inner HTML per agent ── */
  function buildModalHTML(key) {
    switch (key) {
      case "nami":
        return `
          <p>Describe where you want to go, or ask for directions. Nami will open Google Maps with your route.</p>
          <div class="section-label">Your Request</div>
          <input type="text" id="nami-input" placeholder="e.g. Route from Vandalur to Chennai Beach">
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="nami-go"><i class="fa-solid fa-magnifying-glass"></i> Find Route</button>
          </div>
          <div id="nami-result"></div>`;

      case "morgans":
        return `
          <p>Tell Morgans what email to draft — he'll compose it via Gmail.</p>
          <div class="section-label">Email Details</div>
          <input type="email" id="morgans-to" placeholder="Recipient email">
          <input type="text" id="morgans-subject" placeholder="Subject">
          <textarea id="morgans-body" placeholder="Write your email body…"></textarea>
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="morgans-send"><i class="fa-solid fa-paper-plane"></i> Draft & Open Gmail</button>
          </div>
          <div id="morgans-result"></div>
          <div class="section-label" style="margin-top:18px;">Recent</div>
          <div id="morgans-history"><div class="empty-state">No emails yet.</div></div>`;

      case "sanji":
        return `
          <p>Ask Sanji to write an Instagram caption with hashtags for your photo.</p>
          <div class="section-label">Describe your post</div>
          <input type="text" id="sanji-input" placeholder="e.g. Sunset at Marina Beach with friends">
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="sanji-gen"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate Caption</button>
          </div>
          <div id="sanji-result"></div>
          <div class="section-label" style="margin-top:18px;">Recent Captions</div>
          <div id="sanji-history"><div class="empty-state">No captions yet.</div></div>`;

      case "robin":
        return `
          <p>Ask Robin for the latest news on any topic.</p>
          <div class="section-label">Topic</div>
          <input type="text" id="robin-input" placeholder="e.g. Latest tech news, AI breakthroughs">
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="robin-search"><i class="fa-solid fa-newspaper"></i> Get News</button>
          </div>
          <div id="robin-result"></div>`;

      case "brook":
        return `
          <p>Tell Brook what song you want to hear on YouTube Music.</p>
          <div class="section-label">Song Request</div>
          <input type="text" id="brook-input" placeholder="e.g. Play Binks' Sake from One Piece">
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="brook-play"><i class="fa-solid fa-play"></i> Play</button>
          </div>
          <div id="brook-result"></div>
          <div class="section-label" style="margin-top:18px;">Recently Played</div>
          <div id="brook-history"><div class="empty-state">No songs yet. Yohohoho!</div></div>`;

      case "shanks":
        return `
          <p>Search YouTube for any video topic.</p>
          <div class="section-label">Search YouTube</div>
          <input type="text" id="shanks-input" placeholder="e.g. One Piece Episode 1100">
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="shanks-search"><i class="fa-brands fa-youtube"></i> Search</button>
          </div>
          <div id="shanks-result"></div>`;

      case "morco":
        return `
          <p>Ask Morco to write a professional LinkedIn post for you.</p>
          <div class="section-label">Post Topic</div>
          <input type="text" id="morco-input" placeholder="e.g. Just got promoted to Senior Engineer">
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="morco-gen"><i class="fa-solid fa-pen-nib"></i> Generate Post</button>
          </div>
          <div id="morco-result"></div>
          <div class="section-label" style="margin-top:18px;">Recent Posts</div>
          <div id="morco-history"><div class="empty-state">No posts yet.</div></div>`;

      case "zoro":
        return `
          <p>Tell Zoro your task or reminder. He'll keep you on track.</p>
          <div class="section-label">New Task / Reminder</div>
          <textarea id="zoro-input" placeholder="e.g. Remind me to submit the report by Friday 5pm"></textarea>
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-primary" id="zoro-add"><i class="fa-solid fa-plus"></i> Add Task</button>
          </div>
          <div id="zoro-result"></div>
          <div class="section-label" style="margin-top:18px;">Tasks</div>
          <div id="zoro-history"><div class="empty-state">No tasks yet.</div></div>`;

      default:
        return `<p>Coming soon…</p>`;
    }
  }

  /* ══════════════════════════════════════
     MODAL ACTION BINDERS
     ══════════════════════════════════════ */
  function bindModalActions(key) {
    switch (key) {
      case "nami":
        on("nami-go", "click", () => {
          const val = v("nami-input");
          if (!val) return;
          setModalResult("nami-result", "Opening Google Maps…", "processing");
          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val)}`;
          window.open(url, "_blank");
          setModalResult("nami-result", `<a href="${url}" target="_blank">Open Google Maps ↗</a>`, "success");
        });
        break;

      case "morgans":
        on("morgans-send", "click", async () => {
          const to = v("morgans-to");
          const subject = v("morgans-subject");
          const body = v("morgans-body");
          if (!to && !subject && !body) {
            setModalResult("morgans-result", "Fill in at least one field.", "error");
            return;
          }
          setModalResult("morgans-result", "Generating email via AI…", "processing");
          try {
            const cmd = `send email to ${to} subject ${subject} body ${body}`;
            const res = await apiPost("/agent", { command: cmd });
            if (res.success) {
              window.open(res.gmail_url, "_blank");
              setModalResult("morgans-result", `<a href="${res.gmail_url}" target="_blank">Open Gmail ↗</a><br>Subject: ${esc(res.subject)}`, "success");
              addToModalHistory("morgans-history", "✉️", res.subject);
            } else {
              setModalResult("morgans-result", res.message || "Failed.", "error");
            }
          } catch (e) {
            setModalResult("morgans-result", "Error: " + e.message, "error");
          }
        });
        break;

      case "sanji":
        on("sanji-gen", "click", async () => {
          const val = v("sanji-input");
          if (!val) return;
          setModalResult("sanji-result", "Generating caption…", "processing");
          try {
            const res = await apiPost("/instagram/caption", { command: val });
            if (res.success) {
              const captions = res.captions || res.caption || "";
              const hashtags = res.hashtags || "";
              const txt = (Array.isArray(captions) ? captions.join("\n") : captions) + (hashtags ? "\n\n" + hashtags : "");
              setModalResult("sanji-result",
                `<div class="result-box"><pre style="white-space:pre-wrap;margin:0;font-size:12px;">${esc(txt)}</pre></div>
                 <button class="btn" style="margin-top:8px;" onclick="navigator.clipboard.writeText(${JSON.stringify(txt).replace(/"/g, '&quot;')}).then(()=>this.textContent='✓ Copied!')"><i class="fa-regular fa-copy"></i> Copy</button>`,
                "success");
              addToModalHistory("sanji-history", "📸", val);
            } else {
              setModalResult("sanji-result", res.message || "Failed.", "error");
            }
          } catch (e) {
            setModalResult("sanji-result", "Error: " + e.message, "error");
          }
        });
        break;

      case "robin":
        on("robin-search", "click", async () => {
          const val = v("robin-input");
          if (!val) return;
          setModalResult("robin-result", "Fetching news…", "processing");
          try {
            const res = await apiPost("/news/search", { command: val });
            if (res.success) {
              let html = "";
              if (res.articles && res.articles.length) {
                html = res.articles.map(a =>
                  `<div class="history-item"><span class="h-icon">📰</span><span class="h-text"><a href="${esc(a.url)}" target="_blank" style="color:var(--accent-gold);text-decoration:none;">${esc(a.title)}</a></span></div>`
                ).join("");
              } else {
                html = res.summary || "No articles found.";
              }
              setModalResult("robin-result", `<div class="result-box">${html}</div>`, "success");
            } else {
              setModalResult("robin-result", res.message || "Failed.", "error");
            }
          } catch (e) {
            setModalResult("robin-result", "Error: " + e.message, "error");
          }
        });
        break;

      case "brook":
        on("brook-play", "click", async () => {
          const val = v("brook-input");
          if (!val) return;
          setModalResult("brook-result", "Searching YouTube Music…", "processing");
          try {
            const res = await apiPost("/brook/play", { command: val });
            if (res.success) {
              let html = `<strong>${esc(res.track)}</strong>`;
              if (res.artist) html += ` by ${esc(res.artist)}`;
              if (res.embed_url) {
                html += `<div style="margin-top:10px;"><iframe width="100%" height="200" src="${res.embed_url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
              }
              if (res.ytmusic_url) {
                html += `<div style="margin-top:6px;"><a href="${res.ytmusic_url}" target="_blank" style="color:var(--accent-gold);text-decoration:none;">Open in YouTube Music ↗</a></div>`;
              }
              setModalResult("brook-result", `<div class="result-box">${html}</div>`, "success");
              addToModalHistory("brook-history", "🎵", res.track);
            } else {
              setModalResult("brook-result", res.message || "Song not found.", "error");
            }
          } catch (e) {
            setModalResult("brook-result", "Error: " + e.message, "error");
          }
        });
        break;

      case "shanks":
        on("shanks-search", "click", () => {
          const val = v("shanks-input");
          if (!val) return;
          const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(val)}`;
          window.open(url, "_blank");
          setModalResult("shanks-result", `<a href="${url}" target="_blank">Open YouTube Search ↗</a>`, "success");
        });
        break;

      case "morco":
        on("morco-gen", "click", async () => {
          const val = v("morco-input");
          if (!val) return;
          setModalResult("morco-result", "Drafting LinkedIn post…", "processing");
          try {
            const res = await apiPost("/linkedin/post", { command: val });
            if (res.success) {
              const txt = res.post || res.draft || "";
              setModalResult("morco-result",
                `<div class="result-box"><pre style="white-space:pre-wrap;margin:0;font-size:12px;">${esc(txt)}</pre></div>
                 <button class="btn" style="margin-top:8px;" onclick="navigator.clipboard.writeText(${JSON.stringify(txt).replace(/"/g, '&quot;')}).then(()=>this.textContent='✓ Copied!')"><i class="fa-regular fa-copy"></i> Copy</button>`,
                "success");
              addToModalHistory("morco-history", "💼", val);
            } else {
              setModalResult("morco-result", res.message || "Failed.", "error");
            }
          } catch (e) {
            setModalResult("morco-result", "Error: " + e.message, "error");
          }
        });
        break;

      case "zoro":
        on("zoro-add", "click", async () => {
          const val = v("zoro-input");
          if (!val) return;
          setModalResult("zoro-result", "Adding task…", "processing");
          try {
            const res = await apiPost("/todo-remainder/parse", { command: val });
            if (res.success) {
              const msg = `Task: <strong>${esc(res.task || val)}</strong><br>When: ${esc(res.relative || "ASAP")}`;
              setModalResult("zoro-result", msg, "success");
              addToModalHistory("zoro-history", "⚔️", res.task || val);
            } else {
              setModalResult("zoro-result", res.message || "Failed.", "error");
            }
          } catch (e) {
            setModalResult("zoro-result", "Error: " + e.message, "error");
          }
        });
        break;
    }
  }

  /* ══════════════════════════════════════
     AGENT CARD CLICK → OPEN MODAL
     ══════════════════════════════════════ */
  $$(".agent-card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.agent));
  });

  /* ══════════════════════════════════════
     COMMAND INPUT + VOICE
     ══════════════════════════════════════ */
  commandInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const text = commandInput.value.trim();
      if (!text) return;
      commandInput.value = "";
      processCommand(text);
    }
  });

  // Voice recognition
  let recognition = null;
  let listening = false;

  function initSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";

    r.onresult = e => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      commandInput.value = transcript;
      if (e.results[e.results.length - 1].isFinal) {
        processCommand(transcript.trim().toLowerCase());
      }
    };
    r.onend = () => { listening = false; updateMicUI(); };
    r.onerror = () => { listening = false; updateMicUI(); };
    return r;
  }

  function toggleVoice() {
    if (!recognition) recognition = initSpeech();
    if (!recognition) { setStatus("Voice not supported in this browser.", "error"); return; }

    if (listening) { recognition.stop(); } else { recognition.start(); }
    listening = !listening;
    updateMicUI();
  }

  function updateMicUI() {
    voiceBtn.classList.toggle("listening", listening);
    toggleMicBtn.classList.toggle("active", listening);
  }

  voiceBtn.addEventListener("click", toggleVoice);
  toggleMicBtn.addEventListener("click", toggleVoice);

  /* ══════════════════════════════════════
     COMMAND ROUTING
     ══════════════════════════════════════ */
  function processCommand(text) {
    const lower = text.toLowerCase();
    commandHistory.unshift({ text, time: new Date() });
    if (commandHistory.length > 20) commandHistory.pop();

    // ── Map / Travel ──
    if (hasAny(lower, ["route", "directions", "navigate", "travel", "go to", "reach", "how to get", "distance",
      "charge", "charging", "ev station", "bus", "train", "flight", "book ticket"])) {
      setStatus("🗺️ Nami: Opening Google Maps…", "processing");
      openModal("nami");
      setTimeout(() => { const el = document.getElementById("nami-input"); if (el) el.value = text; }, 100);
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      return;
    }

    // ── Email ──
    if (hasAny(lower, ["email", "mail", "send mail", "send email", "gmail", "inbox"])) {
      setStatus("📧 Morgans: Drafting email…", "processing");
      openModal("morgans");
      return;
    }

    // ── Instagram / Caption ──
    if (hasAny(lower, ["instagram", "insta", "caption", "hashtag", "post photo", "photo caption"])) {
      setStatus("📸 Sanji: Generating caption…", "processing");
      openModal("sanji");
      setTimeout(() => { const el = document.getElementById("sanji-input"); if (el) el.value = text; }, 100);
      return;
    }

    // ── News ──
    if (hasAny(lower, ["news", "headlines", "latest", "what's happening", "current events"])) {
      setStatus("📰 Robin: Searching news…", "processing");
      openModal("robin");
      setTimeout(() => { const el = document.getElementById("robin-input"); if (el) el.value = text; }, 100);
      return;
    }

    // ── Music ──
    if (hasAny(lower, ["play", "music", "song", "spotify", "youtube music", "listen"])) {
      setStatus("🎵 Brook: Searching music…", "processing");
      openModal("brook");
      setTimeout(() => { const el = document.getElementById("brook-input"); if (el) el.value = text; }, 100);
      return;
    }

    // ── YouTube video ──
    if (hasAny(lower, ["youtube", "video", "watch"])) {
      setStatus("🎬 YouTube: Searching videos…", "processing");
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      return;
    }

    // ── LinkedIn ──
    if (hasAny(lower, ["linkedin", "post", "pitch", "professional"])) {
      setStatus("💼 Morco: Drafting post…", "processing");
      openModal("morco");
      setTimeout(() => { const el = document.getElementById("morco-input"); if (el) el.value = text; }, 100);
      return;
    }

    // ── Todo / Reminder ──
    if (hasAny(lower, ["todo", "task", "remind", "reminder", "schedule", "don't forget"])) {
      setStatus("⚔️ Zoro: Adding task…", "processing");
      openModal("zoro");
      setTimeout(() => { const el = document.getElementById("zoro-input"); if (el) el.value = text; }, 100);
      return;
    }

    // ── Fallback ──
    setStatus("🤔 Not sure which agent to use. Try being more specific.", "error");
  }

  /* ══════════════════════════════════════
     AUDIO TOGGLE
     ══════════════════════════════════════ */
  toggleAudioBtn.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    toggleAudioBtn.classList.toggle("active", audioEnabled);
    toggleAudioBtn.querySelector("i").className = audioEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
  });

  /* ══════════════════════════════════════
     FULLSCREEN
     ══════════════════════════════════════ */
  toggleFsBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });

  /* ══════════════════════════════════════
     SIDEBAR NAV (visual only for now)
     ══════════════════════════════════════ */
  $$(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      $$(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
    });
  });

  /* ══════════════════════════════════════
     HELPERS
     ══════════════════════════════════════ */
  function hasAny(str, arr) { return arr.some(k => str.includes(k)); }
  function v(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function on(id, evt, fn) { const el = document.getElementById(id); if (el) el.addEventListener(evt, fn); }

  function setStatus(msg, type) {
    barPrimary.textContent = msg;
    barSecondary.textContent = type === "error" ? "Something needs attention." : "All 8 agents are online and ready.";
  }

  function setModalResult(id, html, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="status-msg ${type}">${html}</div>`;
  }

  function addToModalHistory(containerId, icon, text) {
    const el = document.getElementById(containerId);
    if (!el) return;
    // Remove empty state
    const empty = el.querySelector(".empty-state");
    if (empty) empty.remove();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `<span class="h-icon">${icon}</span><span class="h-text">${esc(text)}</span><span class="h-time">${now}</span>`;
    el.prepend(item);
  }

  async function apiPost(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

})();
