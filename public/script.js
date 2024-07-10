window.onload = function () {
  displayCurrentDate();
  fetchQuote();
  displayCalendar();
  updateAuthButton();
};

let moodColors = {
  Happy: "#ffd700",
  Sad: "#4682b4",
  Relaxed: "#90ee90",
  Stressed: "#ff6347",
};

// Initialise the current year, month and entries
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let entries = {};

// Shows the current date in the
function displayCurrentDate() {
  let currentDateElement = document.getElementById("current_date");
  currentDateElement.textContent = new Date().toLocaleDateString("ja-JP", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Gets an inspirational quote from an API
async function fetchQuote() {
  console.log("Fetching quote...");
  await fetch("/proxy-quote")
    .then((response) => {
      console.log("Response received:", response);
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then(({ data }) => {
      console.log("Quote data received:", data);
      const { quote, author } = data;
      if (quote && author) {
        document.getElementById("quote").textContent = `"${quote}"`;
        document.getElementById("author").textContent = `- ${author}`;
      } else {
        console.error("Quote or author is missing in the response data:", data);
      }
    })
    .catch((error) => console.error("Error fetching quote:", error));
}

// Change the calendar page to the previous month
function prevMonth() {
  if (currentMonth === 0) {
    currentMonth = 11;
  } else {
    currentMonth = currentMonth - 1;
  }

  if (currentMonth === 11) {
    currentYear = currentYear - 1;
  } else {
    currentYear = currentYear;
  }

  displayCalendar();
}

// Change the calendar page to the next month
function nextMonth() {
  if (currentMonth === 11) {
    currentMonth = 0;
  } else {
    currentMonth = currentMonth + 1;
  }

  if (currentMonth === 0) {
    currentYear = currentYear + 1;
  } else {
    currentYear = currentYear;
  }
  displayCalendar();
}

// Shows the calendar, by running the generateCalendarHTML function
function displayCalendar() {
  let calendarMain = document.getElementById("calendar_main");
  calendarMain.innerHTML = generateCalendarHTML();
  loadEntries();
}

// Generates the calendar
function generateCalendarHTML() {
  let html = `<tbody>`;
  let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let startDay = new Date(currentYear, currentMonth, 1).getDay();
  let date = 1;

  for (let i = 0; i < 6; i++) {
    html += "<tr>";
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < startDay) {
        html += `<td class="empty"></td>`;
      } else if (date > daysInMonth) {
        html += `<td class="empty"></td>`;
      } else {
        html += `<td class="day" data-date="${currentYear}-${String(
          currentMonth + 1
        ).padStart(2, "0")}-${String(date).padStart(
          2,
          "0"
        )}" onclick="selectDay(this, ${date})">${date}</td>`;
        date++;
      }
    }
    html += "</tr>";
  }
  html += "</tbody>";

  document.getElementById("monthYear").textContent = `${new Date(
    currentYear,
    currentMonth
  ).toLocaleString("en-US", { month: "long" })} ${currentYear}`;
  return html;
}

// Selecting days with debugging features (breaks often for some reason)
function selectDay(cell, day) {
  document
    .querySelectorAll(".day")
    .forEach((cell) => cell.classList.remove("selected-day"));
  cell.classList.add("selected-day");

  let date = `${currentYear}-${String(currentMonth + 1).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
  console.log(`Selected date: ${date}`);

  // Proceed with loading the entry for the selected date
  loadEntryForDate(date);
}

// Clicking a date with saved data outputs the information into the fields right under the Calendar
async function loadEntryForDate(date) {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    console.error("No user ID found in local storage.");
    return;
  }

  let response = await fetch(`/entries?date=${date}&userId=${userId}`);
  if (!response.ok) {
    let responseBody = await response.text();
    console.error(
      `Fetch failed with status ${response.status}. Response body: ${responseBody}`
    );
    return;
  }

  let entries = await response.json();
  console.log("Fetched entries:", entries);

  if (entries.length > 0) {
    let entry = entries[0]; // Assuming only one entry per date
    document.getElementById("dayMood").textContent = entry.mood || "No data";
    document.getElementById("dayJournal").textContent =
      entry.journalEntry || "No data";
    document.getElementById("dayGoals").textContent = entry.goal
      ? entry.goal.split(";").join(", ")
      : "No data";
  } else {
    resetEntryFields();
  }
}

// If the date doesn't have any data, clicking on the day changes the data to no data
function resetEntryFields() {
  document.getElementById("dayMood").textContent = "No data";
  document.getElementById("dayJournal").textContent = "No data";
  document.getElementById("dayGoals").textContent = "No data";
}

// A function that waits for the form submission
async function submitForm(event) {
  event.preventDefault();
  let form = document.getElementById("wellbeingForm");
  let formData = new FormData(form);
  let formObject = Object.fromEntries(formData.entries());

  // Converting goals from separate inputs to an array
  formObject.goals = [
    form.goal1.value,
    form.goal2.value,
    form.goal3.value,
    form.goal4.value,
  ];

  let selectedDay = document.querySelector(".day.selected-day").textContent;
  formObject.date = `${currentYear}-${String(currentMonth + 1).padStart(
    2,
    "0"
  )}-${String(selectedDay).padStart(2, "0")}`;

  formObject.userId = localStorage.getItem("userId");

  // debug tool if the data is empty and the db isn't working
  console.log("Submitting form with data:", formObject);

  let response = await fetch("/submit-form", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formObject),
  });

  let responseBody = await response.text();
  console.log("Response:", responseBody);

  if (response.ok) {
    alert("Data submitted successfully");
    entries[formObject.date] = formObject;
    saveMood(formObject.date, formObject.mood);
  } else {
    let errorData = JSON.parse(responseBody);
    alert("Failed to submit data: " + errorData.error);
  }
}

// Saves the mood that was input for the mood field
function saveMood(date, mood) {
  let dayElement = document.querySelector(`.day[data-date="${date}"]`);
  if (dayElement) {
    dayElement.style.backgroundColor = moodColors[mood];
  }
}

// Loads the information from the database (colors) into the logged in user's view
function loadEntries() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    entries = {};
    return;
  }

  fetch(
    `/entries?year=${currentYear}&month=${String(currentMonth + 1).padStart(
      2,
      "0"
    )}&userId=${userId}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to load entries");
      }
    })
    .then((data) => {
      entries = {};
      data.forEach((entry) => {
        entries[entry.date] = {
          mood: entry.mood,
          journalEntry: entry.journalEntry,
          goals: entry.goals ? entry.goals.split(";") : [],
        };
      });
      loadMoods();
    })
    .catch((error) => {
      console.error(error);
      alert("Failed to load entries");
    });
}

// Uploads the colors of the saved moods for the dates
function loadMoods() {
  document.querySelectorAll(".day").forEach((dayElement) => {
    let date = dayElement.getAttribute("data-date");
    if (entries[date]) {
      dayElement.style.backgroundColor = moodColors[entries[date].mood];
    }
  });
}

// Updates the button in the top right hand color to match the status (logged/not logged)
function updateAuthButton() {
  let userId = localStorage.getItem("userId");
  let auth_button = document.getElementById("auth_button");
  if (userId) {
    auth_button.textContent = "Logout";
    auth_button.onclick = logout;
  } else {
    auth_button.textContent = "Login";
  }
}

// Submits the form upon pressing the button
document.getElementById("wellbeingForm").addEventListener("submit", submitForm);

// Log out function
function logout() {
  localStorage.removeItem("userId");
  alert("Logged out successfully");
  window.location.href = "login.html";
}
