// ================================================
// STREAMVIBE — player.js
// ================================================

// ---- State ----
let currentUser  = null;
let userProfile  = null;
let videoData    = null;
let watchSeconds = 0;
let watchTimer   = null;
let limitSeconds = 300;
let limitWarned  = false;
let commentsOpen = false;
let isDragging   = false;

// Tap tracking per zone
const tapState = {
  left:   { count: 0, timer: null },
  center: { count: 0, timer: null },
  right:  { count: 0, timer: null },
};

// ---- Video library with working URLs ----
const VIDEO_LIBRARY = {
  v1:  {
    id:"v1", title:"The Future of AI — What's Next?",
    channel:"TechVision", views:"1.2M",
    src:"https://www.w3schools.com/html/mov_bbb.mp4"
  },
  v2:  {
    id:"v2", title:"Top 10 Goals of the Season",
    channel:"SportZone", views:"890K",
    src:"https://www.w3schools.com/html/movie.mp4"
  },
  v3:  {
    id:"v3", title:"Street Food India — Mumbai Edition",
    channel:"FoodieWalker", views:"2.1M",
    src:"https://www.w3schools.com/html/mov_bbb.mp4"
  },
  v4:  {
    id:"v4", title:"Midnight Raaga — Live Concert 2024",
    channel:"MusicMela", views:"450K",
    src:"https://www.w3schools.com/html/movie.mp4"
  },
  v5:  {
    id:"v5", title:"Build a REST API in 20 Minutes",
    channel:"CodeWithMe", views:"3.4M",
    src:"https://www.w3schools.com/html/mov_bbb.mp4"
  },
  v6:  {
    id:"v6", title:"Stand-Up Comedy Night Highlights",
    channel:"LaughFactory", views:"1.8M",
    src:"https://www.w3schools.com/html/movie.mp4"
  },
  v7:  {
    id:"v7", title:"Champions League Final — Best Moments",
    channel:"SportZone", views:"5.6M",
    src:"https://www.w3schools.com/html/mov_bbb.mp4"
  },
  v8:  {
    id:"v8", title:"Lofi Hip-Hop — Study & Chill",
    channel:"ChillWaves", views:"22M",
    src:"https://www.w3schools.com/html/movie.mp4"
  },
  v9:  {
    id:"v9", title:"React vs Vue vs Angular in 2024",
    channel:"CodeWithMe", views:"780K",
    src:"https://www.w3schools.com/html/mov_bbb.mp4"
  },
  v10: {
    id:"v10", title:"Desi Comedy Roast — Episode 12",
    channel:"LaughFactory", views:"3.1M",
    src:"https://www.w3schools.com/html/movie.mp4"
  },
  v11: {
    id:"v11", title:"Kerala Backwaters — Travel Vlog",
    channel:"WanderLens", views:"670K",
    src:"https://www.w3schools.com/html/mov_bbb.mp4"
  },
  v12: {
    id:"v12", title:"Classical Carnatic Fusion — 4K",
    channel:"MusicMela", views:"290K",
    src:"https://www.w3schools.com/html/movie.mp4"
  },
};

const VIDEO_ORDER = ["v1","v2","v3","v4","v5","v6","v7","v8","v9","v10","v11","v12"];

// ---- Page init ----
window.addEventListener("DOMContentLoaded", async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  // Try to load profile, but don't block if Firestore is slow
  try {
    userProfile = await Promise.race([
      getUserProfile(currentUser.uid),
      new Promise(res => setTimeout(() => res(null), 3000))
    ]);
  } catch(e) {
    userProfile = null;
  }

  const plan   = userProfile?.plan || "free";
  const limits = getPlanLimit(plan);
  limitSeconds = limits.watchMinutes === 9999 ? Infinity : limits.watchMinutes * 60;

  const badge = document.getElementById("user-plan-badge");
  if (badge) badge.textContent = plan.toUpperCase();

  // Get video ID from URL
  const params  = new URLSearchParams(window.location.search);
  const videoId = params.get("v") || "v1";
  videoData     = VIDEO_LIBRARY[videoId] || VIDEO_LIBRARY["v1"];

  loadVideo(videoData);

  // Progress bar click to seek
  document.getElementById("progress-container")
    .addEventListener("click", seekVideo);

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboard);

  // Load comments
  loadComments(videoId);

  // Hide gesture hint after 4 seconds
  setTimeout(() => {
    const hint = document.getElementById("gesture-hint");
    if (hint) hint.style.opacity = "0";
    setTimeout(() => { if (hint) hint.style.display = "none"; }, 500);
  }, 4000);
});

// ---- Load video ----
function loadVideo(v) {
  const video  = document.getElementById("main-video");

  // Set source directly on the element
  video.src    = v.src;
  video.load();

  // Show loading state
  document.getElementById("video-title").textContent  = v.title;
  document.getElementById("channel-name").textContent = v.channel;
  document.getElementById("view-count").textContent   = v.views + " views";

  // Attach events
  video.ontimeupdate    = onTimeUpdate;
  video.onloadedmetadata = onMetaLoaded;
  video.onended         = onVideoEnded;
  video.onplay          = () => updatePlayBtn(true);
  video.onpause         = () => updatePlayBtn(false);
  video.oncanplay       = () => console.log("✅ Video ready to play");
  video.onerror         = (e) => {
    console.error("Video error:", e);
    showToast("Video failed to load. Trying next...", "error");
  };

  // Auto-play after a short delay (browser policy)
  setTimeout(() => {
    video.play().then(() => {
      startWatchTimer();
    }).catch(err => {
      // Autoplay blocked by browser — user needs to click play
      console.log("Autoplay blocked, waiting for user click:", err.message);
      showToast("Click ▶ or tap center to play", "default", 3000);
    });
  }, 500);
}

// ---- Time update ----
function onTimeUpdate() {
  const video    = document.getElementById("main-video");
  const current  = video.currentTime;
  const duration = video.duration || 1;
  const pct      = (current / duration) * 100;

  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-thumb").style.left = pct + "%";
  document.getElementById("time-display").textContent  =
    `${formatTime(current)} / ${formatTime(duration)}`;
}

// ---- Metadata loaded ----
function onMetaLoaded() {
  markLimitOnProgressBar();
}

// ---- Video ended ----
function onVideoEnded() {
  stopWatchTimer();
  updatePlayBtn(false);
  showToast("Loading next video...", "default");
  setTimeout(skipToNext, 1500);
}

// ---- Watch Timer ----
function startWatchTimer() {
  if (watchTimer) return;
  watchTimer = setInterval(() => {
    watchSeconds++;
    updateTimerPill();

    // Warn at 80% of limit
    if (!limitWarned && limitSeconds !== Infinity && watchSeconds >= limitSeconds * 0.8) {
      limitWarned = true;
      const rem = Math.ceil((limitSeconds - watchSeconds) / 60);
      showToast(`⏱ Only ${rem} min left on your plan`, "default", 4000);
      document.getElementById("watch-timer-pill")?.classList.add("warning");
    }

    // Limit reached
    if (limitSeconds !== Infinity && watchSeconds >= limitSeconds) {
      stopWatchTimer();
      document.getElementById("main-video").pause();
      showLimitOverlay();
    }
  }, 1000);
}

function stopWatchTimer() {
  clearInterval(watchTimer);
  watchTimer = null;
}

function updateTimerPill() {
  const pill = document.getElementById("watch-timer-pill");
  if (!pill) return;
  pill.textContent = "⏱ " + formatTime(watchSeconds);
  if (limitSeconds !== Infinity && watchSeconds >= limitSeconds * 0.9) {
    pill.classList.remove("warning");
    pill.classList.add("danger");
  }
}

function showLimitOverlay() {
  const overlay = document.getElementById("limit-overlay");
  const msg     = document.getElementById("limit-msg");
  const plan    = userProfile?.plan || "free";
  const limits  = getPlanLimit(plan);
  msg.textContent = `Your ${limits.label} plan allows ${limits.watchMinutes} minutes per video. Upgrade to keep watching!`;
  overlay.classList.remove("hidden");
}

function closeLimitOverlay() {
  document.getElementById("limit-overlay").classList.add("hidden");
}

// ---- Mark limit on progress bar ----
function markLimitOnProgressBar() {
  const video    = document.getElementById("main-video");
  const duration = video.duration;
  if (!duration || limitSeconds === Infinity) return;
  const pct    = Math.min((limitSeconds / duration) * 100, 100);
  const marker = document.getElementById("limit-marker");
  if (marker) marker.style.left = pct + "%";
}

// ---- Seek via progress bar ----
function seekVideo(e) {
  const bar  = document.getElementById("progress-bar");
  const rect = bar.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  const video = document.getElementById("main-video");
  if (video.duration) {
    video.currentTime = pct * video.duration;
  }
}

// ---- Play / Pause ----
function togglePlayPause() {
  const video = document.getElementById("main-video");
  if (video.paused || video.ended) {
    video.play().then(() => startWatchTimer()).catch(console.error);
  } else {
    video.pause();
    stopWatchTimer();
  }
}

function updatePlayBtn(isPlaying) {
  const btn = document.getElementById("play-pause-btn");
  if (btn) btn.textContent = isPlaying ? "⏸" : "▶";
}

// ---- Skip ----
function skipVideo(seconds) {
  const video = document.getElementById("main-video");
  video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  showGestureFeedback(seconds > 0 ? "right" : "left");
}

// ---- Volume ----
function setVolume(val) {
  const video = document.getElementById("main-video");
  video.volume = parseFloat(val);
  updateMuteBtn(parseFloat(val) > 0);
}

function toggleMute() {
  const video = document.getElementById("main-video");
  video.muted = !video.muted;
  updateMuteBtn(!video.muted);
}

function updateMuteBtn(isOn) {
  const btn = document.getElementById("mute-btn");
  if (btn) btn.textContent = isOn ? "🔊" : "🔇";
}

// ---- Next video ----
function skipToNext() {
  const params  = new URLSearchParams(window.location.search);
  const videoId = params.get("v") || "v1";
  const idx     = VIDEO_ORDER.indexOf(videoId);
  const nextId  = VIDEO_ORDER[(idx + 1) % VIDEO_ORDER.length];
  window.location.href = `player.html?v=${nextId}`;
}

// ---- Fullscreen ----
function toggleFullscreen() {
  const wrapper = document.getElementById("video-wrapper");
  if (!document.fullscreenElement) {
    wrapper.requestFullscreen?.() || wrapper.webkitRequestFullscreen?.();
  } else {
    document.exitFullscreen?.() || document.webkitExitFullscreen?.();
  }
}

// ================================================
//   GESTURE CONTROLS (Point 5)
// ================================================

function handleZoneClick(zone) {
  const state = tapState[zone];
  state.count++;

  clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    const taps   = state.count;
    state.count  = 0;

    if (zone === "left") {
      if (taps === 2)    { skipVideo(-10); }
      else if (taps >= 3){ toggleComments(); showGestureFeedback("left", "💬"); }
    }

    if (zone === "center") {
      if (taps === 1)    { togglePlayPause(); showGestureFeedback("center"); }
      else if (taps >= 3){ skipToNext(); showGestureFeedback("center", "⏭"); }
    }

    if (zone === "right") {
      if (taps === 2)    { skipVideo(10); }
      else if (taps >= 3){ closeWebsite(); }
    }

  }, 300);
}

function handleZoneDblClick(zone) {
  // Handled inside handleZoneClick via tap counter
}

function closeWebsite() {
  showGestureFeedback("right", "✕");
  showToast("Closing StreamVibe...", "default");
  setTimeout(() => window.close(), 800);
}

function showGestureFeedback(zone, icon = null) {
  const el = document.getElementById(`gf-${zone}`);
  if (!el) return;

  if (icon) {
    const span = el.querySelector("span");
    if (span) span.textContent = icon;
  } else if (zone === "center") {
    const video = document.getElementById("main-video");
    const span  = document.getElementById("gf-center-icon");
    if (span) span.textContent = video.paused ? "▶" : "⏸";
  }

  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 700);
}

// ---- Keyboard shortcuts ----
function handleKeyboard(e) {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
  switch(e.code) {
    case "Space":      e.preventDefault(); togglePlayPause(); break;
    case "ArrowRight": skipVideo(10);  break;
    case "ArrowLeft":  skipVideo(-10); break;
    case "KeyF":       toggleFullscreen(); break;
    case "KeyM":       toggleMute(); break;
    case "KeyC":       toggleComments(); break;
    case "KeyN":       skipToNext(); break;
  }
}

// ---- Toggle comments ----
function toggleComments() {
  const panel  = document.getElementById("comments-panel");
  const layout = document.querySelector(".player-layout");
  commentsOpen = !commentsOpen;
  panel.classList.toggle("open", commentsOpen);
  layout.classList.toggle("comments-open", commentsOpen);
}

// ---- Download ----
async function handleDownload() {
  if (!videoData) return;
  const plan   = userProfile?.plan || "free";
  const limits = getPlanLimit(plan);

  if (plan === "free") {
    const today   = new Date().toDateString();
    const dlCount = userProfile?.downloads || 0;
    const lastDl  = userProfile?.lastDownload;
    if (lastDl === today && dlCount >= limits.downloadsPerDay) {
      showToast("Daily limit reached! Upgrade for unlimited.", "error");
      setTimeout(() => { window.location.href = "plans.html"; }, 1500);
      return;
    }
  }

  showToast("⬇ Downloading...", "default");
  try {
    await db.collection("users").doc(currentUser.uid).update({
      downloads:    firebase.firestore.FieldValue.increment(1),
      lastDownload: new Date().toDateString(),
    });
    const docRef = await db.collection("downloads").add({
      uid:          currentUser.uid,
      videoId:      videoData.id,
      videoTitle:   videoData.title,
      downloadedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Download record added:', docRef.id, 'uid=', currentUser.uid, 'videoId=', videoData.id);
    // If profile page is open or loadDownloads is available, refresh the list
    if (typeof loadDownloads === 'function') {
      try { loadDownloads(); } catch(e) { console.warn('Could not refresh downloads list:', e); }
    }
    // Insert a local placeholder entry into downloads list UI if visible
    try {
      const listEl = document.getElementById('downloads-list');
      if (listEl) {
        const now = new Date();
        const title = videoData.title || 'Video';
        const itemHtml = `
          <div class="download-item">
            <span class="dl-icon">🎬</span>
            <div>
              <p class="dl-title">${title}</p>
              <p class="dl-date">${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <button class="btn btn-ghost btn-sm dl-play" onclick="window.location.href='player.html?v=${videoData.id}'">▶ Play</button>
          </div>
        `;
        listEl.insertAdjacentHTML('afterbegin', itemHtml);
      }
    } catch (e) { console.warn('Could not insert local download item:', e); }
  } catch(e) { console.warn("Firestore update failed:", e); }

  showToast("✅ Saved to Downloads!", "success");
  // Attempt to download the video file in-browser (best-effort).
  try {
    const url = videoData.src;
    if (url) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Network response not ok');
      const blob = await resp.blob();
      const ext = (url.split('.').pop().split(/[#?]/)[0]) || 'mp4';
      const filename = `${(videoData.title || 'video').replace(/[^\w\s-]/g,'').replace(/\s+/g,'_')}.${ext}`;
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    }
  } catch (err) {
    console.warn('Download failed, opening video in new tab instead:', err);
    if (videoData.src) window.open(videoData.src, '_blank');
  }
}

// ---- Comments and translation support ----
const COMMENT_ALLOWED = /^[\p{L}\p{N}\s.,?!'"()\-:]+$/u;

async function loadComments(videoId) {
  const list = document.getElementById("comments-list");
  list.innerHTML = `<p class="comments-loading">Loading comments...</p>`;

  try {
    const snapshot = await db.collection("comments")
      .where("videoId", "==", videoId)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      list.innerHTML = `<p class="empty-sub">No comments yet. Be the first to share!</p>`;
      return;
    }

    list.innerHTML = snapshot.docs
      .map(doc => renderCommentCard(doc.id, doc.data()))
      .join("");
  } catch (err) {
    console.error("Could not load comments:", err);
    list.innerHTML = `<p class="empty-sub">Could not load comments. Try refreshing.</p>`;
  }
}

function renderCommentCard(id, comment) {
  const avatar   = escapeHtml((comment.author || "User").slice(0, 1).toUpperCase());
  const author   = escapeHtml(comment.author || "Unknown");
  const city     = escapeHtml(comment.city || "Unknown");
  const text     = escapeHtml(comment.text || "");
  const likes    = comment.likes || 0;
  const dislikes = comment.dislikes || 0;

  return `
    <div class="comment-card" data-id="${id}" data-original-text="${encodeURIComponent(text)}">
      <div class="comment-top">
        <div class="comment-avatar">${avatar}</div>
        <span class="comment-author">${author}</span>
        <span class="comment-city">📍 ${city}</span>
      </div>
      <p class="comment-text">${text}</p>
      <div class="comment-actions">
        <button class="comment-btn btn-like" onclick="likeComment('${id}')">👍 ${likes}</button>
        <button class="comment-btn btn-dislike" onclick="dislikeComment('${id}')">👎 ${dislikes}</button>
        <button class="translate-btn" onclick="translateComment('${id}')">Translate</button>
      </div>
    </div>
  `;
}

async function postComment() {
  const input      = document.getElementById("comment-input");
  const targetLang = document.getElementById("translate-lang").value;
  const text       = input.value.trim();

  if (!text) {
    showToast("Write something before posting.", "error");
    return;
  }

  if (!COMMENT_ALLOWED.test(text)) {
    showToast("Comments cannot contain special characters.", "error");
    return;
  }

  if (!currentUser) {
    showToast("Please log in to post comments.", "error");
    return;
  }

  const payload = {
    videoId:   videoData.id,
    uid:       currentUser.uid,
    author:    currentUser.displayName || "StreamVibe user",
    city:      window.userCity || "Unknown",
    text,
    likes:     0,
    dislikes:  0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await db.collection("comments").add(payload);
    const list   = document.getElementById("comments-list");
    if (list) {
      list.innerHTML = renderCommentCard(docRef.id, payload) + list.innerHTML;
    }
    input.value = "";
    showToast("Comment posted!", "success");
    if (targetLang) translateComment(docRef.id, targetLang);
  } catch (err) {
    console.error("Could not post comment:", err);
    showToast("Could not post comment. Try again.", "error");
  }
}

async function translateComment(commentId, forcedTarget) {
  const target = forcedTarget || document.getElementById("translate-lang").value;
  if (!target) {
    showToast("Select a target language first.", "error");
    return;
  }

  const card = document.querySelector(`[data-id="${commentId}"]`);
  if (!card) return;

  const original = decodeURIComponent(card.dataset.originalText || "");
  const textEl   = card.querySelector(".comment-text");
  if (!textEl) return;

  textEl.textContent = "Translating...";

  try {
    const translated = await translateText(original, target);
    textEl.textContent = translated;
    if (!card.querySelector(".comment-translated-note")) {
      const note = document.createElement("div");
      note.className = "comment-translated-note";
      note.textContent = `Translated to ${languageName(target)}`;
      note.style.fontSize = "0.72rem";
      note.style.color = "var(--text-muted)";
      note.style.marginTop = "0.35rem";
      card.appendChild(note);
    }
    showToast("Translation loaded.", "success");
  } catch (err) {
    console.error("Translation failed:", err);
    textEl.textContent = original;
    showToast("Translation failed. Try another language.", "error");
  }
}

async function translateText(text, target) {
  const response = await fetch("https://libretranslate.de/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target,
      format: "text",
      api_key: ""
    })
  });

  if (!response.ok) {
    throw new Error(`Translation API error (${response.status})`);
  }

  const data = await response.json();
  return data.translatedText || text;
}

function languageName(code) {
  const map = {
    en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
    kn: "Kannada", ml: "Malayalam", fr: "French",
    es: "Spanish", de: "German", zh: "Chinese",
    ar: "Arabic", ja: "Japanese"
  };
  return map[code] || code;
}

async function likeComment(commentId) {
  const ref = db.collection("comments").doc(commentId);
  try {
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) throw new Error("Comment not found.");
      tx.update(ref, { likes: firebase.firestore.FieldValue.increment(1) });
    });
    const card  = document.querySelector(`[data-id="${commentId}"]`);
    const button = card?.querySelector(".btn-like");
    if (button) {
      const current = parseInt(button.textContent.replace(/[^0-9]/g, ""), 10) || 0;
      button.textContent = `👍 ${current + 1}`;
    }
  } catch (err) {
    console.error("Like failed:", err);
    showToast("Could not like comment.", "error");
  }
}

async function dislikeComment(commentId) {
  const ref = db.collection("comments").doc(commentId);
  try {
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) throw new Error("Comment not found.");
      const dislikes = (doc.data().dislikes || 0) + 1;
      if (dislikes >= 2) {
        tx.delete(ref);
        return { removed: true };
      }
      tx.update(ref, { dislikes: firebase.firestore.FieldValue.increment(1) });
      return { removed: false, dislikes };
    });

    const card = document.querySelector(`[data-id="${commentId}"]`);
    if (result.removed) {
      card?.remove();
      showToast("Comment removed after 2 dislikes.", "default");
      return;
    }

    const button = card?.querySelector(".btn-dislike");
    if (button) button.textContent = `👎 ${result.dislikes}`;
  } catch (err) {
    console.error("Dislike failed:", err);
    showToast("Could not dislike comment.", "error");
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---- Helpers ----
function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function handleLogout() {
  await auth.signOut();
  window.location.href = "../index.html";
}