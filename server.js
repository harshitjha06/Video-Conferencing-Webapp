const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");


// initializing socket to handle events such as connection/disconnection on http server
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
app.use(express.static("public"));

// if the client sends a req from the root url redirect it to a new url with a random roomid
// the new url acts a room 
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

//if the clients sends a request from a particular room render the room view
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// handling the connection event for socket object
io.on("connection", (socket) => {

  //event called by peer when a client joins a room is read by socket which executes a function 
  //to join the user using socket to that room 
  socket.on("new_user_joinroom", (roomId, userId, userName) => {
    socket.join(roomId);

    //emit a broadcast event user-connected for every new client joining the room
    //so that every client connected in that room can append the new client's video stream in 
    //their html view
    io.to(roomId).emit("user-connected", userId);

    //handling the message event, whenever read, emits createmessage event
    //which can be read by every client to display the message
    socket.on("message_sent", (message) => {
      io.to(roomId).emit("create_Message", message, userName);
    });

    //leave-user event is initiated when a user leaves by script.js and is read here
    //user-disconnected event is broadcasted to the room(in which the disconnected client was)
    //for every remaining client to remove the disconnected users video from their respective html
    //idstream is the id of the videostream for every client and is also the id of the video element
    //in the html
    socket.on("leave_user", (ROOM_ID, idstream) => {   
      io.to(ROOM_ID).emit("user-disconnected", idstream);
      console.log("test", idstream);
    });
  });
});

server.listen(process.env.PORT || 3000);
