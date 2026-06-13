
let comments =
JSON.parse(localStorage.getItem("comments")) || [];
function addComment() {

    const username =
    document.getElementById("username").value.trim();

    const text =
    document.getElementById("commentInput").value.trim();

    if(username === "" || text === ""){
        alert("Please enter name and comment");
        return;
    }

    comments.push({
        username: username,
        text: text,
        likes: 0,
        dislikes: 0
    });
localstorage.setitem("comments,JSON.STRINGIFY(COMMENTS)
);
    document.getElementById("username").value = "";
    document.getElementById("commentInput").value = "";

    displayComments();
}

function displayComments(){

    let html = "";

    comments.forEach((comment,index)=>{

        html += `
        <div class="comment">

            <h4>${comment.username}</h4>

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

    document.getElementById("comments").innerHTML =
    html;
}

function likeComment(index){
    comments[index].likes++;

    localstroage.setItem("comments",JSON.stringify(comments)
    );
    displaycomments();
}

function dislikeComment(index){
    comments[index].dislikes++;

    localstorage.setItem("comments",JSON.stringify(comments)
    );
    displaycomments();
}


let watchLimit = 5;

function upgradePlan(plan, price, minutes){

    watchLimit = minutes;

    document.getElementById(
        "premiumStatus"
    ).innerText =
    `Current Plan: ${plan}`;

    alert(
        `Payment Successful

Plan: ${plan}
Amount: ₹${price}`
    );
}


function verifyRegion(){

    const state =
    document.getElementById("stateInput")
    .value
    .trim()
    .toLowerCase();

    const southStates = [
        "tamil nadu",
        "kerala",
        "karnataka",
        "andhra pradesh",
        "telangana"
    ];

    let otp =
    Math.floor(
        100000 + Math.random() * 900000
    );

    if(
        southStates.includes(state)
    ){

        document.getElementById(
            "authResult"
        ).innerHTML =
        "📧 Email OTP Sent: " + otp;

    }else{

        document.getElementById(
            "authResult"
        ).innerHTML =
        "📱 Mobile OTP Sent: " + otp;
    }
}


const video =
document.getElementById("videoPlayer");

video.addEventListener(
    "timeupdate",
    function(){

        if(
            watchLimit !== -1 &&
            video.currentTime >=
            watchLimit * 60
        ){

            video.pause();

            alert(
                "Watch limit reached. Upgrade plan."
            );
        }
    }
);
window.onload = function(){
    displaycomments();
};
