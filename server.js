const express = require("express");
const app = express();
const port = 3000;
const path = require("path"); // library used to create and save the database
const bodyParser = require("body-parser"); // library used to get information from an HTTP request
const sqlite3 = require("sqlite3").verbose(); // library used to create the database with user data
const nodemailer = require("nodemailer"); // library for automation of password recovery
const { MongoClient, ObjectId } = require("mongodb");

app.use(express.static(path.join(__dirname, "public"))); // creates an easy way to access webpages in the URL field
app.use(bodyParser.json()); // used to help access the requests as req.body.*

// Establish connection to the non-relational database in MongoDB with all the users
let url =
  "mongodb+srv://academicprogramming69:smGFluw5AW5Vozqj@moodtrackerproject.temdegk.mongodb.net/?retryWrites=true&w=majority&appName=MoodTrackerProject";
let usersCollection;
let client = new MongoClient(url);

async function run_mongo_db() {
  try {
    await client.connect();
    usersCollection = client.db("moodTrackerDB").collection("users");
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run_mongo_db();

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

  let existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  let newUser = { username, email, password };

  await usersCollection.insertOne(newUser);
  res.json({ message: "User registered" });
});

// User login
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await usersCollection.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "Email or password is incorrect" });
  }

  let isPasswordValid = false;
  if (password == user.password) {
    isPasswordValid = true;
  }
  if (!isPasswordValid) {
    return res.status(400).json({ error: "Email or password is incorrect" });
  }

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
  let user = await usersCollection.findOne({ email });
  if (!user) return res.json({ error: "Email not found" });

  let resetPassword = "resetPassword";

  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { resetPassword: resetPassword } }
  );

  let mailOptions = {
    to: email,
    from: "psychologycalendarwebsite@gmail.com",
    subject: "Resetting your password",
    text: `Dear Subscriber, here is your link to reset the password. Click on the link to recover your account!
        http://${req.headers.host}/new-password.html?reset=${resetPassword}. Please ignore this email if you didn't ask for password recovery`,
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
  let { reset: reset_password, newPassword } = req.body;
  let user = await usersCollection.findOne({
    resetPassword: reset_password,
  });
  if (!user) {
    return res.json({ error: "Password reset string is invalid" });
  }

  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { password: newPassword } }
  );

  res.json({ message: "Password reset successfully" });
});

// Retrieving user data
app.get("/profile", async (req, res) => {
  let userId = req.query.userId;
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  let user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ username: user.username });
});

// Handle form submissions
app.post("/submit-form", async (req, res) => {
  try {
    let { mood, journalEntry, goals, date, userId } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    let newLog = {
      userId,
      date,
      mood,
      journalEntry,
      goal: goals.join(", "),
    };

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
