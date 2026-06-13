let comments =
JSON.parse(localStorage.getItem("comments")) || [];

let isPremium =
localStorage.getItem("premium") === "true";

// Comment System

function addComment(){

    const username =
    document.getElementById("username").value.trim();

    const text =
    document.getElementById("commentInput").value.trim();

    if(username === "" || text === ""){
        alert("Enter name and comment");
        return;
    }

    comments.push({
        username,
        text,
        likes:0,
        dislikes:0,
        date:new Date().toLocaleString()
    });

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();

    document.getElementById("commentInput").value="";
}

function displayComments(){

    let html="";

    comments.forEach((comment,index)=>{

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

    document.getElementById("comments").innerHTML =
    html;
}

function likeComment(index){

    comments[index].likes++;

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();
}

function dislikeComment(index){

    comments[index].dislikes++;

    if(comments[index].dislikes >= 2){
        comments.splice(index,1);
    }

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();
}

function deleteComment(index){

    comments.splice(index,1);

    localStorage.setItem(
        "comments",
        JSON.stringify(comments)
    );

    displayComments();
}

// Premium

function buyPremium(){

    localStorage.setItem(
        "premium",
        "true"
    );

    isPremium = true;

    document.getElementById("premiumStatus")
    .innerText =
    "⭐ Premium User";

    alert("Premium Activated Successfully!");
}

// Download

function downloadVideo(){

    let downloads =
    JSON.parse(localStorage.getItem("downloads"))
    || [];

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

function showDownloads(){

    let downloads =
    JSON.parse(localStorage.getItem("downloads"))
    || [];

    let html="";

    downloads.forEach(item=>{
        html += `<li>${item}</li>`;
    });

    document.getElementById("downloadsList")
    .innerHTML = html;
}

// Dark Mode

function toggleDarkMode(){

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
    );
}

// Load Page

window.onload = function(){

    displayComments();

    showDownloads();

    if(isPremium){

        document.getElementById(
            "premiumStatus"
        ).innerText =
        "⭐ Premium User";
    }

    if(
        localStorage.getItem("darkMode")
        === "true"
    ){
        document.body.classList.add("dark");
    }
};

