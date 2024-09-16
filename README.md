# IU_Project
Web Application for Daily Logging

**Aim of the Work:**
Creation of a Psychological Well-being Tracker, which is designed to help users monitor and manage their psychological health. The functionality involves tracking mood (Several pre-set values to choose from), journal entries (describing the day), and daily goals to promote self-awareness and personal growth.

**Ideas:**
Minimally: motivational quotes, daily mood tracking, daily journal entries, daily goal setting, and visualization of data on a calendar. Ideally retrospective analysis of positives and negatives throughout the day.
Maximally (harder to implement): user accounts and adding data to the days in the past, with subsequent review of data logged in the past. Analysis of data stored in the database with weekly notifications of the past week's summary.

**Concept:**
The current early concept (alpha version) of the project revolves around providing users with a tool to track their mental health and well-being, providing users with their mood review and how it affects goal fulfillment. By tracking daily mood, journaling their life, and setting goals (up to 4), one would be able to able to gain a better insight into their own life.

**Plan:**
Develop the web application with key features such as mood tracking, journal entry input, and goal setting. The early concept would have only the functionality of logging data every day and being able to save it in the database, as well as return to it (by switching days). 
User account creation with subsequent summarized data review would be a harder thing to implement, although should be possible.

**Methodology/Tool:**
Front-end: HTML, CSS (vanilla), and JavaScript (button functionality).
Back-end: Node.js (server-side) with Express.js framework, MongoDB, and Mongoose (store user data).
API: Stoic Quotes API for fetching quotes to display in the front end.
Tools: Microsoft Visual Studio Code, Git, and GitHub.

# Installation guide
1) Install Node.js from the website: https://nodejs.org/en (you can check the version in the IDE terminal by writing `node -v`)
2) Initialise Node.js using the command `npm init -y`
3) Install dependecies necessary for the server to run:
`npm install express body-parser sqlite3 nodemailer crypto bcrypt mongoose cors node-fetch`

5) Clone the repository into your chosen folder using `git clone` via the IDE terminal
6) Configure Environment: Before running the server, ensure you've configured any required credentials:
MongoDB: Update the MongoDB connection string in the server.js file:
  line 53: `let MongoURL = "<mongodb-address>";`
Nodemailer: Replace the email credentials with your own:
  line 143: `user: "<recovery-email@gmail.com>"`
7) `cd` into the folder, where the `server.js` file is
8) Write the command `node server.js`
9) The terminal will notify you that the web application is running at the `http://localhost:3000` address
10) Paste `http://localhost:3000` into any web browser search bar

