// ================================================
// STREAMVIBE — profile.js
// PURPOSE: Load and display user profile + downloads
// ================================================

let currentUser   = null;
let userProfile   = null;

window.addEventListener("DOMContentLoaded", async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  userProfile = await getUserProfile(currentUser.uid);
  if (!userProfile) return;

  // Fill profile header
  document.getElementById("profile-name").textContent =
    `${userProfile.firstName} ${userProfile.lastName}`;
  document.getElementById("profile-email").textContent = userProfile.email;

  // Show location
  const locEl = document.getElementById("profile-location");
  if (window.userCity) {
    locEl.textContent = `📍 ${window.userCity}`;
  } else {
    locEl.textContent = "📍 Location not detected";
  }

  // Plan badge
  const plan = userProfile.plan || "free";
  document.getElementById("user-plan-badge").textContent = plan.toUpperCase();
  document.getElementById("plan-label").textContent =
    getPlanLimit(plan).label.toUpperCase() + " PLAN";

  // Settings fields
  document.getElementById("settings-name").value =
    `${userProfile.firstName} ${userProfile.lastName}`;
  document.getElementById("settings-phone").value = userProfile.phone || "";

  // Load downloads
  loadDownloads();
});

// ---- Show tab ----
function showTab(tabName, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".profile-tab").forEach(b => b.classList.remove("active"));

  document.getElementById(`tab-${tabName}`).classList.remove("hidden");
  btn.classList.add("active");
}

// ---- Load downloads from Firestore ----
async function loadDownloads() {
  const list = document.getElementById("downloads-list");
  list.innerHTML = "<p class='loading-text'>Loading...</p>";

  try {
    const snapshot = await db.collection("downloads")
      .where("uid", "==", currentUser.uid)
      .orderBy("downloadedAt", "desc")
      .limit(20)
      .get();

    console.log('Loaded downloads snapshot size:', snapshot.size);
    snapshot.docs.forEach(d => console.log('download doc:', d.id, d.data()));

    if (snapshot.empty) {
      list.innerHTML = "<p class='empty-sub'>No downloads yet. Start watching and download your favourites!</p>";
      return;
    }

    list.innerHTML = snapshot.docs.map(doc => {
      const d = doc.data();
      return `
        <div class="download-item">
          <span class="dl-icon">🎬</span>
          <div>
            <p class="dl-title">${d.videoTitle || "Video"}</p>
            <p class="dl-date">${formatDate(d.downloadedAt)}</p>
          </div>
          <button class="btn btn-ghost btn-sm dl-play"
            onclick="window.location.href='player.html?v=${d.videoId}'">
            ▶ Play
          </button>
        </div>
      `;
    }).join("");

  } catch (err) {
    list.innerHTML = "<p class='empty-sub'>Could not load downloads. Try again later.</p>";
    console.error(err);
  }
}

// ---- Save settings ----
async function saveSettings() {
  const name = document.getElementById("settings-name").value.trim();
  if (!name) return showToast("Name cannot be empty.", "error");

  const parts = name.split(" ");
  const fname = parts[0] || "";
  const lname = parts.slice(1).join(" ") || "";

  try {
    await db.collection("users").doc(currentUser.uid).update({
      firstName: fname,
      lastName:  lname,
    });
    await currentUser.updateProfile({ displayName: name });
    showToast("Settings saved!", "success");
  } catch (err) {
    showToast("Could not save: " + err.message, "error");
  }
}

// ---- Logout ----
async function handleLogout() {
  await auth.signOut();
  window.location.href = "../index.html";
}
