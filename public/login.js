document.getElementById("login-form").onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Construit l'en-tête Basic Auth (btoa = équivalent navigateur de base64)
  const authHeader = "Basic " + btoa(username + ":" + password);

  // Vérifie les identifiants auprès d'une route protégée
  const res = await fetch("/api/me", {
    headers: { Authorization: authHeader },
  });

  const message = document.getElementById("message");
  if (res.ok) {
    // Stocke l'en-tête pour la session, puis accède au Bat-Ordinateur
    sessionStorage.setItem("auth", authHeader);
    window.location.href = "/bat-computer";
  } else {
    message.style.color = "#ff6b6b";
    message.innerText = "Identifiants invalides.";
  }
};
