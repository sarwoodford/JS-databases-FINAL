const express = require("express");
const expressWs = require("express-ws");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");

const PORT = 3000;
//TODO: Replace with the URI pointing to your own MongoDB setup
const MONGO_URI = "mongodb://localhost:27017/keyin_test";
const app = express();
const SALT_ROUNDS = 10;
expressWs(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "chat-app-secret",
    resave: false,
    saveUninitialized: true,
  })
);

let connectedClients = [];

//Note: These are (probably) not all the required routes, but are a decent starting point for the routes you'll probably need

app.ws("/ws", (socket, request) => {
  socket.on("message", (rawMessage) => {
    const parsedMessage = JSON.parse(rawMessage);
  });

  socket.on("close", () => {});
});

app.get("/", async (request, response) => {
  response.render("index/unauthenticated");
});

app.get("/login", async (request, response) => {});

app.get("/signup", async (request, response) => {
  return response.render("signup", { errorMessage: null });
});

app.post("/signup", async (request, response) => {
  const { username, password } = request.body;
  try {
    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.render("signup", {
        errorMessage: "Username already taken.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the new user and save it to the database
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Redirect the user to the login page
    return response.redirect("/login");
  } catch (error) {
    console.error("Error signing up:", error);
    return response.render("signup", {
      errorMessage: "Registration was unsuccessful. Please try again.",
    });
  }
});

app.get("/dashboard", async (request, response) => {
  return response.render("index/authenticated");
});

app.get("/profile", async (request, response) => {});

app.post("/logout", (request, response) => {});

mongoose
  .connect(MONGO_URI)
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    )
  )
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  joinDate: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sender: { type: String, required: true },
  timeSent: { type: Date, default: Date.now },
});

const User = mongoose.model("user", userSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { User, Message };

async function seedUsers() {
  try {
    const userCount = await User.countDocuments();

    const adminPassword = await bcrypt.hash("admin123", 10);
    const regUserPassword = await bcrypt.hash("user123", 10);

    if (userCount === 0) {
      await User.insertMany([
        {
          username: "Admin Doe",
          password: adminPassword,
          role: "admin",
          joinDate: new Date("2024-03-03"),
        },
        {
          username: "Regular Smith",
          password: regUserPassword,
          role: "user",
          joinDate: new Date("2024-11-01"),
        },
      ]);
      console.log("Seeded users collection.");
    }
  } catch (err) {
    console.error("Error seeding users collection:", err);
  }
}

/**
 * Handles a client disconnecting from the chat server
 *
 * This function isn't necessary and should be deleted if unused. But it's left as a hint to how you might want
 * to handle the disconnection of clients
 *
 * @param {string} username The username of the client who disconnected
 */
function onClientDisconnected(username) {}

/**
 * Handles a new client connecting to the chat server
 *
 * This function isn't necessary and should be deleted if unused. But it's left as a hint to how you might want
 * to handle the connection of clients
 *
 * @param {WebSocket} newSocket The socket the client has opened with the server
 * @param {string} username The username of the user who connected
 */
function onNewClientConnected(newSocket, username) {}

/**
 * Handles a new chat message being sent from a client
 *
 * This function isn't necessary and should be deleted if unused. But it's left as a hint to how you might want
 * to handle new messages
 *
 * @param {string} message The message being sent
 * @param {string} username The username of the user who sent the message
 * @param {strng} id The ID of the user who sent the message
 */
async function onNewMessage(message, username, id) {}
