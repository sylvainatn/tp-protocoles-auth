const loginForm = document.getElementById("login-form");
const twofaForm = document.getElementById("twofa-form");
const message = document.getElementById("message");

let currentUsername = null;

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.style.color = "";
  message.textContent = "";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => null);

  if (res.status === 403 && data && data.requiresEnrollment) {
    message.style.color = "red";
    message.innerHTML =
      (data.error || "Activation 2FA requise.") +
      ' <a href="/auth/setup-2fa">Activer la 2FA</a>';
    return;
  }

  if (res.ok && data && data.requires2FA) {
    currentUsername = data.username;
    loginForm.classList.add("hidden");
    twofaForm.classList.remove("hidden");
    message.style.color = "";
    message.textContent =
      "Entrez le code de votre application d'authentification.";
    document.getElementById("code").focus();
    return;
  }

  message.style.color = "red";
  message.textContent = (data && data.error) || "Erreur de connexion.";
});

twofaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.style.color = "";
  message.textContent = "";

  const token = document.getElementById("code").value;

  const res = await fetch("/api/verify-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username: currentUsername, token }),
  });
  const data = await res.json().catch(() => null);

  if (res.ok) {
    window.location.href = (data && data.redirect) || "/bat-computer";
    return;
  }

  message.style.color = "red";
  message.textContent = (data && data.error) || "Code invalide.";
});
