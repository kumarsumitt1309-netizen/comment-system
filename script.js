
let comments =
JSON.parse(localStorage.getItem("comments")) || [];

function addComment() {

    const text =
    document.getElementById("commentInput").value.trim();

    if (text === "") {
        alert("Enter a comment");
        return;
    }

    comments.push({
        text: text,
        likes: 0,
        dislikes: 0
    });

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();

    document.getElementById("commentInput").value = "";
}

function likeComment(index) {

    comments[index].likes++;

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();
}

function dislikeComment(index) {

    comments[index].dislikes++;

    if (comments[index].dislikes >= 2) {
        comments.splice(index, 1);
    }

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();
}

function displayComments() {

    let html = "";

    comments.forEach((comment, index) => {

        html += `
        <div class="comment">
            <p>${comment.text}</p>

            <button onclick="likeComment(${index})">
                👍 ${comment.likes}
            </button>

            <button onclick="dislikeComment(${index})">
                👎 ${comment.dislikes}
            </button>
        </div>
        `;
    });

    document.getElementById("comments").innerHTML = html;
}


let isPremium =
localStorage.getItem("premium") === "true";

function buyPremium() {

    localStorage.setItem("premium", "true");

    isPremium = true;

    document.getElementById("premiumStatus").innerText =
    "⭐ Premium User";

    alert("🎉 Premium Activated Successfully!");
}

// =========================
// VIDEO DOWNLOADER
// =========================

function downloadVideo() {

    let today = new Date().toDateString();

    let lastDay =
    localStorage.getItem("downloadDay");

    let count =
    parseInt(localStorage.getItem("downloadCount")) || 0;

    if (lastDay !== today) {
        count = 0;
        localStorage.setItem("downloadDay", today);
    }

    if (!isPremium && count >= 1) {

        alert(
            "Free users can download only 1 video per day. Upgrade to Premium."
        );

        return;
    }

    count++;

    localStorage.setItem(
        "downloadCount",
        count
    );

    let downloads =
    JSON.parse(
        localStorage.getItem("downloads")
    ) || [];

    downloads.push(
        "Video Downloaded - " +
        new Date().toLocaleString()
    );

    localStorage.setItem(
        "downloads",
        JSON.stringify(downloads)
    );

    showDownloads();

    alert("✅ Video Downloaded Successfully!");
}

function showDownloads() {

    let downloads =
    JSON.parse(
        localStorage.getItem("downloads")
    ) || [];

    let html = "";

    downloads.forEach(item => {
        html += `<li>${item}</li>`;
    });

    document.getElementById(
        "downloadsList"
    ).innerHTML = html;
}


window.onload = function () {

    displayComments();

    showDownloads();

    if (
        localStorage.getItem("premium") === "true"
    ) {

        document.getElementById(
            "premiumStatus"
        ).innerText = "⭐ Premium User";
    }
};

