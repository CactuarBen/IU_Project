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

// Function for registration
async function register() {
  let username = document.getElementById("register_username").value;
  let email = document.getElementById("register_email").value;
  let password = document.getElementById("register_password").value;
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
  event.preventDefault(); // Prevent the form from submitting

  let urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get("token");
  let newPassword = document.getElementById("new_password").value;
  let response = await fetch("/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
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
