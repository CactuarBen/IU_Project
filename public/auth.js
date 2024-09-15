// Function for logging in
async function login() {
  let email = document.getElementById("login_email").value;
  let password = document.getElementById("login_password").value;
  let response = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  let data = await response.json();
  if (response.ok) {
    localStorage.setItem("userId", data.userId);
    window.location.href = "index.html";
  } else {
    document.getElementById("login_error").textContent = data.error;
  }
}

// Function for checking the password for the security rules
function checkPassword(password) {
  let errors = [];

  // Checks the password for the specific length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  // Checks for the presence of an uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  // Checks for the presence of a lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  // Check for the presence of a number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }

  return errors;
}

// Function for registration
async function register() {
  let username = document.getElementById("register_username").value;
  let email = document.getElementById("register_email").value;
  let password = document.getElementById("register_password").value;

  // Checks the password for following the rules specified above
  let passwordErrors = checkPassword(password);
  if (passwordErrors.length > 0) {
    let errorMessages = "";
    
    // Starts every error line from a new line
    for (let error of passwordErrors) {
      errorMessages += error + "<br>";
    }
    document.getElementById("register_error").innerHTML = errorMessages;
    return; // Stops if the password doesn't fulfill criteria
  }
  
  // Sends the response with the data to the server, so that it gets saved in MongoDB
  let response = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  let data = await response.json();
  if (response.ok) {
    window.location.href = "login.html";
    document.getElementById("login_error").textContent =
      "Registration successful. Please log in.";
  } else {
    document.getElementById("register_error").textContent = data.error;
  }
}

// Function for sending a password reset email
async function requestPasswordReset() {
  let email = document.getElementById("reset_email").value;
  let response = await fetch("/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  let data = await response.json();
  if (response.ok) {
    alert("Password reset link sent to your email.");
  } else {
    document.getElementById("forgot_password_error").textContent = data.error;
  }
}

// Function that resets the password
async function resetPassword(event) {
  event.preventDefault(); // Prevent the form from automatically submitting

  let urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get("reset");
  let new_password = document.getElementById("new_password").value;

  // Checks the password for following the rules specified above
  let passwordErrors = checkPassword(new_password);
  if (passwordErrors.length > 0) {
    let errorMessages = "";
    
    // Starts every error line from a new line
    for (let error of passwordErrors) {
      errorMessages += error + "<br>";
    }
    document.getElementById("register_error").innerHTML = errorMessages;
    return; // Stops if the password doesn't fulfill criteria
    }

  console.log(
    `Resetting password with token: ${token} and new password: ${new_password}`
  );
  let response = await fetch("/new-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password }),
  });
  let data = await response.json();
  let messageElement = document.getElementById("message");

  if (response.ok) {
    messageElement.textContent = "Password reset successfully. Please log in.";
    window.location.href = "login.html";
  } else {
    messageElement.textContent = data.error;
  }
}
