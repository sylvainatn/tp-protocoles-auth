const credentialsForm = document.getElementById("credentials-form");
const confirmForm = document.getElementById("confirm-form");
const qrSection = document.getElementById("qr-section");
const message = document.getElementById("message");

let username = null;
let password = null;

credentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.style.color = "";
  message.textContent = "";

  username = document.getElementById("username").value;
  password = document.getElementById("password").value;

  const res = await fetch("/api/2fa/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    message.style.color = "red";
    message.textContent =
      (data && data.error) || "Erreur lors de l'initialisation.";
    return;
  }

  document.getElementById("qr-image").src = data.qrCode;
  document.getElementById("secret").textContent = data.secret;
  qrSection.classList.remove("hidden");
  credentialsForm.classList.add("hidden");
  message.textContent = "Scannez le QR Code puis saisissez le code généré.";
});

confirmForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.style.color = "";
  message.textContent = "";

  const token = document.getElementById("code").value;

  const res = await fetch("/api/2fa/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password, token }),
  });
  const data = await res.json().catch(() => null);

  if (res.ok) {
    message.style.color = "green";
    message.innerHTML =
      (data.message || "2FA activée.") +
      ' <a href="/auth/login">Se connecter</a>';
    confirmForm.classList.add("hidden");
    return;
  }

  message.style.color = "red";
  message.textContent = (data && data.error) || "Code invalide.";
});
