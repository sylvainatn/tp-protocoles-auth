function authFetch(url, options = {}) {
  options.credentials = "same-origin";
  return fetch(url, options);
}

document.getElementById("logout").onclick = async () => {
  try {
    await fetch("/api/me", {
      headers: { Authorization: "Basic " + btoa("logout:logout") },
    });
  } catch (e) {}
  window.location.href = "/register.html";
};

async function init() {
  const meRes = await authFetch("/api/me");
  if (!meRes.ok) {
    document.getElementById("welcome").textContent =
      "Accès refusé : recharge la page pour te réauthentifier.";
    return;
  }
  const me = await meRes.json();
  document.getElementById("welcome").textContent =
    `Bienvenue, Justicier ${me.username}`;

  const secretsRes = await authFetch("/api/secrets");
  const gadgets = await secretsRes.json();
  const arsenal = document.getElementById("arsenal");
  gadgets.forEach((g) => {
    arsenal.insertAdjacentHTML(
      "beforeend",
      `<div class="card">
         <h3>${g.name}</h3>
         <p>${g.desc}</p>
       </div>`,
    );
  });
}

document.getElementById("report-form").onsubmit = async (e) => {
  e.preventDefault();
  const content = document.getElementById("report-content").value;
  const res = await authFetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const msg = document.getElementById("report-message");
  if (res.ok) {
    msg.textContent = "Rapport enregistré !";
    document.getElementById("report-form").reset();
  } else {
    msg.textContent = "Erreur lors de l'envoi du rapport.";
  }
};

init();
