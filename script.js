[];

let comments = 
function addComment() {

    const text =
        document.getElementById("commentInput").value;

    if (text === "") {
        alert("Enter a comment");
        return;
    }

    comments.push({
        text: text,
        likes: 0,
        dislikes: 0
    });

    displayComments();

    document.getElementById("commentInput").value = "";
}

function likeComment(index) {
    comments[index].likes++;
    displayComments();
}

function dislikeComment(index) {

    comments[index].dislikes++;

    if (comments[index].dislikes >= 2) {
        comments.splice(index, 1);
    }

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

window.onload = function () {

    if (isPremium) {

        const status =
            document.getElementById("premiumStatus");

        if (status) {
            status.innerText = "⭐ Premium User";
        }
    }

    showDownloads();
};

function buyPremium() {

    localStorage.setItem("premium", "true");

    isPremium = true;

    const status =
        document.getElementById("premiumStatus");

    if (status) {
        status.innerText = "⭐ Premium User";
    }

    alert("🎉 Premium Activated Successfully!");
}

function downloadVideo() {

    let today = new Date().toDateString();

    let lastDay =
        localStorage.getItem("downloadDay");

    let count =
        parseInt(localStorage.getItem("downloadCount")) || 0;

    if (lastDay !== today) {

        count = 0;

        localStorage.setItem(
            "downloadDay",
            today
        );
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

    // Demo download
    alert("✅ Video Downloaded Successfully!");
}

function showDownloads() {

    let downloads =
        JSON.parse(
            localStorage.getItem("downloads")
        ) || [];

    let html = "";

    downloads.forEach(item => {

        html += `
        <li>${item}</li>
        `;
    });

    const list =
        document.getElementById("downloadsList");

    if (list) {
        list.innerHTML = html;
    }
}
