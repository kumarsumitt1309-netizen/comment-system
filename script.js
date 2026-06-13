
let comments =
JSON.parse(localStorage.getItem("comments")) || [];

let currentPlan =
localStorage.getItem("plan") || "Free";

let watchLimit =
parseInt(localStorage.getItem("watchLimit")) || 5;



function addComment() {

    const username =
    document.getElementById("username").value.trim();

    const text =
    document.getElementById("commentInput").value.trim();

    if (username === "" || text === "") {
        alert("Enter name and comment");
        return;
    }

    comments.push({
        username: username,
        text: text,
        likes: 0,
        dislikes: 0,
        date: new Date().toLocaleString()
    });

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();

    document.getElementById(
        "commentInput"
    ).value = "";
}



function displayComments() {

    let html = "";

    comments.forEach((comment, index) => {

        html += `
        <div class="comment">

            <h4>${comment.username}</h4>

            <p>${comment.text}</p>

            <small>${comment.date}</small>

            <br><br>

            <button onclick="likeComment(${index})">
                👍 ${comment.likes}
            </button>

            <button onclick="dislikeComment(${index})">
                👎 ${comment.dislikes}
            </button>

            <button onclick="deleteComment(${index})">
                🗑 Delete
            </button>

        </div>
        `;
    });

    document.getElementById(
        "comments"
    ).innerHTML = html;
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



function deleteComment(index) {

    comments.splice(index, 1);

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();
}


function upgradePlan(plan, price, minutes) {

    localStorage.setItem(
        "plan",
        plan
    );

    localStorage.setItem(
        "watchLimit",
        minutes
    );

    currentPlan = plan;
    watchLimit = minutes;

    document.getElementById(
        "premiumStatus"
    ).innerText =
    `Current Plan: ${plan}`;

    alert(
        `Payment Successful!

Plan: ${plan}
Amount: ₹${price}

Invoice Generated
Email Notification Sent`
    );
}



function downloadVideo() {

    const plan =
    localStorage.getItem("plan") || "Free";

    if (plan === "Free") {

        alert(
            "Free users cannot download videos. Upgrade your plan."
        );

        return;
    }

    let downloads =
    JSON.parse(
        localStorage.getItem("downloads")
    ) || [];

    downloads.push(
        "Downloaded on " +
        new Date().toLocaleString()
    );

    localStorage.setItem(
        "downloads",
        JSON.stringify(downloads)
    );

    showDownloads();

    alert("Video Download Started!");
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


function toggleDarkMode() {

    document.body.classList.toggle(
        "dark"
    );

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains(
            "dark"
        )
    );
}



window.onload = function () {

    displayComments();

    showDownloads();

    const savedPlan =
    localStorage.getItem("plan");

    if (savedPlan) {

        document.getElementById(
            "premiumStatus"
        ).innerText =
        `Current Plan: ${savedPlan}`;
    }

    if (
        localStorage.getItem(
            "darkMode"
        ) === "true"
    ) {
        document.body.classList.add(
            "dark"
        );
    }

    const video =
    document.getElementById(
        "videoPlayer"
    );

    if (video) {

        video.addEventListener(
            "timeupdate",
            function () {

                const limit =
                parseInt(
                    localStorage.getItem(
                        "watchLimit"
                    )
                ) || 5;

                if (
                    limit !== -1 &&
                    video.currentTime >=
                    limit * 60
                ) {

                    video.pause();

                    alert(
                        "Watch limit reached. Upgrade your plan."
                    );
                }
            }
        );
    }
};
