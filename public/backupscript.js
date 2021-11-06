
const socket = io("/");
const video_grid = document.getElementById("video-grid");
const user_myvideo = document.createElement("video");
const show_Chat = document.querySelector("#showChat");
const remove_chat = document.querySelector("#chatclose");
user_myvideo.muted = true;

remove_chat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
  show_Chat.style.display = "flex";
});

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
});

let myroom;
let curruser;
let user_myvideoStream;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    user_myvideoStream = stream;
    console.log("call2", user_myvideoStream.id);
    addVideoStream(user_myvideo, stream, socket.id);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        console.log("call1", userVideoStream.id);
        addVideoStream(video, userVideoStream, socket.id);
      });
    });
    socket.on("user-connected", (userId, userName, socid) => {
      connectToNewUser(userId, stream, userName, socid);
    });
  });

const connectToNewUser = (userId, stream, userName, socid) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.id = socid;
  call.on("stream", (userVideoStream) => {
    console.log("call3", userVideoStream.id);
    addVideoStream(video, userVideoStream, socid);
  });
};

peer.on("open", (id) => {
  myroom = ROOM_ID;
  val = val + 1;
  socket.emit("join-room", ROOM_ID, id, user, socket.id);
});

const addVideoStream = (video, stream, userId) => {
  video.srcObject = stream;
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

//if client/user clicks on mutton button the event is heard and if audiotrack is enabled 
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


