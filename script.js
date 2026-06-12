let comments = [];

function addComment(){

const text =
document.getElementById("commentInput").value;

if(text===""){
alert("Enter a comment");
return;
}

comments.push({
text:text,
likes:0,
dislikes:0
});

displayComments();

document.getElementById("commentInput").value="";
}

function likeComment(index){
comments[index].likes++;
displayComments();
}

function dislikeComment(index){

comments[index].dislikes++;

if(comments[index].dislikes>=2){
comments.splice(index,1);
}

displayComments();
}

function displayComments(){

let html="";

comments.forEach((comment,index)=>{

html+=`
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

document.getElementById("comments").innerHTML=html;
}