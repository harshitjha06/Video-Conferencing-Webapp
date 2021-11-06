
const socket = io("/");

//we use getelementid to get html objects with that particular id
const video_grid = document.getElementById("video-grid");
const user_myvideo = document.createElement("video");

//using query selector for elements with no particular id
const show_Chat = document.querySelector("#showChat");
const remove_chat = document.querySelector("#chatclose");

//attribute muted, mutes the video
user_myvideo.muted = true;

//remove_chat is a element which is also a target even
//when clicked toggle removes chat and introduces chat button
remove_chat.addEventListener("click", () => {
  //setting html elements display to none to hide them once the click event for remove_chat
  //has taken place
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
  show_Chat.style.display = "flex";
});

//showchat opposite of removechat bring ups the chat as well as 
//the removechat button
show_Chat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "0.5";
  document.querySelector(".header__back").style.display = "flex";
  show_Chat.style.display = "none";
});

const user = prompt("Enter your name");

var peer = new Peer({
  config: {'iceServers': [
    {
      urls: "stun:eu-turn4.xirsys.com"
    },
    { url: 'turn:numb.viagenie.ca',
    credential: 'muazkh',
    username: 'webrtc@live.com'}
  ]} /* Sample servers, please use appropriate ones */
  //using a sample iceserver
});

//defining global variables for that particular client
let myroom;
let user_myvideoStream;

navigator.mediaDevices
  .getUserMedia({
    //permission prompt for audio/video
    audio: true,
    video: true,
  })
  .then((stream) => {
    //if video and audio stream is established/given permission following lines of code are initiated
    user_myvideoStream = stream;
    console.log("call2", user_myvideoStream.id);
    //appending new user's video in his own html and waiting for other clients in the room to make a call
    //so that the new user can append their videos as well
    append_newVideoStream(user_myvideo, stream);

    //peer listens to call which is made by a remote peer using the new users id
    //peer intialises a call stream which we can use to answer back
    //or listen to events
    peer.on("call", (call) => {

      //newly added user answers the call made by all other clients/peers in the room with its own
      //media stream (call back)
      call.answer(stream);

      //creating a new video element for every other client in the room who initiated a call to the new user
      //allowing the user to append their video stream in its own html 
      const video = document.createElement("video");

      //listening to the stream event that is emitted when a remote peer adds a stream
      call.on("stream", (client_VideoStream) => {
        console.log("call1", client_VideoStream.id);
        append_newVideoStream(video, client_VideoStream);
      });
    });

    //function initiated if socket reads an event that user is connected
    //this event is emitted by server.js to every client in the room
    socket.on("user-connected", (userId) => {
      connectClient_toNewUser(userId, stream);
    });
  });

const connectClient_toNewUser = (userId, stream) => {
  //creating a call to send to the new user with clients own video 
  //also reading the response from the new user
  //basically pre existing client A sending its video to new client C
  //to be added in C's own view
  //also A recieveing C's video in return to be added in A's view
  const call = peer.call(userId, stream);
  const video = document.createElement("video");

  call.on("stream", (client_VideoStream) => {
    console.log("call3", client_VideoStream.id);
    append_newVideoStream(video, client_VideoStream);
  });
};

//peer listens to an event 'open' which is made when a new connection is established to the peer server
peer.on("open", (id) => {
  myroom = ROOM_ID;
  val = val + 1;
  socket.emit("new_user_joinroom", ROOM_ID, id, user);
});

//this function is called when the client appends a video into its html video grid
//video.id = stream.id allows us to later when a user disconnects delete the video
//of the disconnected user from every client by using its id
const append_newVideoStream = (video, stream) => {
  //getting the source of the media
  video.srcObject = stream;
  //loadmetadeta is fired when thee metadata is loaded
  video.addEventListener("loadedmetadata", () => {
    // console.log(userId);
    video.play();
    video.id = stream.id
    video_grid.appendChild(video);
  });
};

let text_container = document.querySelector("#chat_message"); //input container
let send_message = document.getElementById("send"); //send message button
let messages = document.querySelector(".messages"); //div element containing the conversation

//event listen listening to click event for the send button
//it reads any text in the text container and emits an event named message 
//which on server side calls another event to show the message for all clients in the room
send_message.addEventListener("click", (e) => {
  if (text_container.value.length !== 0) {
    socket.emit("message_sent", text_container.value);
    text_container.value = "";
  }
});

//implementing send button function for enter key as well
text_container.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text_container.value.length !== 0) {
    socket.emit("message_sent", text_container.value);
    text_container.value = "";
  }
});

const invitenewuser_Button = document.querySelector("#inviteButton");
const muteaudio_Button = document.querySelector("#muteButton");
const stopVideo_Button = document.querySelector("#stopVideo");

//if client/user clicks on mute button the event is heard and if audiotrack is enabled 
//it disables the audio track and overrides the normal microphone icon
muteaudio_Button.addEventListener("click", () => {
  const isaudio = user_myvideoStream.getAudioTracks()[0].enabled;
  if (isaudio) {
    user_myvideoStream.getAudioTracks()[0].enabled = false;
    //new html for muted icon overriding current icon
    html = `<i class="fas fa-microphone-alt-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    user_myvideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone-alt"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

//implementing mute functionality but for video 
stopVideo_Button.addEventListener("click", () => {
  const isvideo = user_myvideoStream.getVideoTracks()[0].enabled;
  if (isvideo) {
    user_myvideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    user_myvideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

//invite button when clicked prompts the client with the room url 
//which can be used to join that particular room
invitenewuser_Button.addEventListener("click", (e) => {
  prompt(
    "Share this link!",
    window.location.href
  );
});

//when a user leaves we need to remove that users video from every client on that room
//beforeunload captures the leaving event of a client and emits leave_user with its
// videostream id which is also the id for the video element in html for every other client in the room
window.addEventListener('beforeunload', function (e) {
  e.preventDefault();
  e.returnValue = '';
  socket.emit("leave_user", ROOM_ID, user_myvideoStream.id);
});

// read event broadcasted by server when a client leaves with its videoid
// using the video id every client in the room removes the video of the disconnected client
socket.on("user-disconnected", (idstream) => {
  console.log("disconnect", idstream);
  document.getElementById(idstream).remove();
})

// reading createmessage event broadcasted by server.js to every client in the room to display the
// text message sent by a user
socket.on("create_Message", (message, Name) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="fas fa-user-circle"></i> <span> ${
          Name === user ? "me" : Name
        }</span> </b>
        <span>${message}</span>
    </div>`;
});


