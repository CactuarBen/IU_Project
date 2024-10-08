const express = require("express");
const app = express();
const port = 3000;
const path = require("path"); // library used to create and save the database
const bodyParser = require("body-parser"); // library used to get information from an HTTP request, parsing middleware
const sqlite3 = require("sqlite3").verbose(); // library used to create the database with user data
const nodemailer = require("nodemailer"); // library for automation of password recovery
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const cors = require("cors");
const fetch = require("node-fetch");

app.use(express.static(path.join(__dirname, "public"))); // creates an easy way to access webpages in the URL field
app.use(bodyParser.json()); // used to help access the requests as req.body.*

// First, apply the cors middleware with default settings
app.use(cors());

// Then, define your custom CORS headers middleware
function setCorsHeaders(req, res, next) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://stoic.tekloon.net/stoic-quote"
  ); // Specify a particular origin
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
}

// Apply the custom middleware after cors
app.use(setCorsHeaders);

// Fixes the CORS issue, fetches the quote with correct headers
// Then the script.js fetches the data from the backend
app.get("/proxy-quote", async (req, res) => {
  console.log("Received request for /proxy-quote");
  let response = await fetch("https://stoic.tekloon.net/stoic-quote");
  console.log("Fetched quote from remote server:", response.status);
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  let data = await response.json();
  console.log("Quote data received from remote server:", data);
  res.json(data);
});

// Establish connection to the non-relational database in MongoDB with all the users
let MongoURL =
  "mongodb+srv://academicprogramming69:smGFluw5AW5Vozqj@moodtrackerproject.temdegk.mongodb.net/moodTrackerDB?retryWrites=true&w=majority";
mongoose
  .connect(MongoURL)
  .then(() => console.log("Connected to MongoDB using Mongoose!"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Creates a userSchema for Mongoose
let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  reset_password: { type: String, required: false },
});
let User = mongoose.model("User", userSchema);

// Create a new SQLite database or connect to an existing one
let db = new sqlite3.Database("mood_data_logs.db");

// Create entries table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  date TEXT,
  mood TEXT,
  journalEntry TEXT,
  goal TEXT,
  UNIQUE(userId, date)
)`);

// User registration
app.post("/register", async (req, res) => {
  let { username, email, password } = req.body;
  let hashed_password = await bcrypt.hash(password, 10);

  let existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  let newUser = new User({ username, email, password: hashed_password });
  await newUser.save();
  res.json({ message: "User registered" });
});

// User login
app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    // Check if the user exists in the database
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email or password is incorrect" });
    }

    // Compare the current password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Email or password is incorrect" });
    }

    // Password matches - send a success response with the user's ID
    res.json({ message: "Login successful", userId: user._id });
});

// Nodemailer setup for recovering passwords
let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "psychologycalendarwebsite@gmail.com",
    pass: "gbqdfyfjtideclsg",
  },
});

// Forgotten password reset
app.post("/reset-password", async (req, res) => {
  let { email } = req.body;
  let user = await User.findOne({ email });
  if (!user) return res.json({ error: "Email not found" });

  let reset_password = crypto.randomBytes(32).toString("hex");

  // Update the user log
  user.reset_password = reset_password;
  await user.save();

  let mailOptions = {
    to: email,
    from: "psychologycalendarwebsite@gmail.com",
    subject: "Resetting your password",
    text: `Dear Subscriber, here is your link to reset the password. Click on the link to recover your account!
        http://${req.headers.host}/new-password.html?reset=${reset_password}. Please ignore this email if you didn't ask for password recovery`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error("Error sending email:", err);
      return res.json({ error: "Error sending email" });
    }
    res.json({ message: "Password reset email sent" });
  });
});

// Reset password
app.post("/new-password", async (req, res) => {
  let { token, new_password } = req.body;
  let hashed_password = await bcrypt.hash(new_password, 10);
  console.log(`Received new password request with token: ${token}`);

  // Find the user with the right reset token
  let user = await User.findOne({ reset_password: token });

  if (!user) {
    return res.json({ error: "Password reset string is invalid" });
  }

  console.log(`Found user for token: ${token}`);
  // Update the user's password
  user.password = hashed_password;
  // Clear the reset token
  user.reset_password = undefined;
  // Save the updated user document
  await user.save();
  console.log(`Password updated for user ${user.email}`);
  console.log(user.password);
  console.log(user.reset_password);

  res.json({ message: "Password reset successfully" });
});

// Retrieving user data
app.get("/profile", async (req, res) => {
  let userId = req.query.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  let user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ username: user.username });
});

// Handle form submissions
app.post("/submit-form", async (req, res) => {
  try {
    let { mood, journalEntry, goals, date, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    let newLog = {
      userId,
      date,
      mood,
      journalEntry,
      goal: goals.join(", "),
    };

    // A new feature that checks if an entry for the given date exists
    // Then it rewrites the existing date for the userId
    db.get(
      `SELECT * FROM entries WHERE userId = ? AND date = ?`,
      [userId, date],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: "Error querying the database" });
        }

        // if entry exists, update it
        if (row) {
          db.run(
            `UPDATE entries 
             SET mood = ?, journalEntry = ?, goal = ?
             WHERE userId = ? AND date = ?`,
            [
              newLog.mood,
              newLog.journalEntry,
              newLog.goal,
              newLog.userId,
              newLog.date,
            ],
            function (err) {
              if (err) {
                return res.status(500).json({ error: "Error updating log" });
              }
              res.json({ message: "Log updated successfully", logId: row.id });
            }
          );
        } else {
          // Entry does not exist, insert a new one
          db.run(
            `INSERT INTO entries (userId, date, mood, journalEntry, goal) VALUES (?, ?, ?, ?, ?)`,
            [
              newLog.userId,
              newLog.date,
              newLog.mood,
              newLog.journalEntry,
              newLog.goal,
            ],
            function (err) {
              if (err) {
                return res.status(500).json({ error: "Error saving log" });
              }
              res.json({ message: "Log saved successfully", logId: this.lastID });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Error saving log:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Retrieving user data for a specific month or specific date
app.get("/entries", async (req, res) => {
  let userId = req.query.userId;
  let { year, month, date } = req.query;

  let query = "SELECT * FROM entries WHERE userId = ? AND date LIKE ?";
  let params = [userId, `${year}-${String(month).padStart(2, "0")}%`];

  if (date) {
    query = "SELECT * FROM entries WHERE userId = ? AND date = ?";
    params = [userId, date];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error retrieving data from database:", err);
      res.json({ error: "Internal server error" });
    } else {
      res.json(rows);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
