// ÉTAPE 4 — Résilience frontend : "Retry Pattern".
//
// apiFetch() encapsule le fetch natif. Si l'accessToken (15 s) a expiré,
// l'API répond 401 : on met la requête "en pause", on appelle POST
// /api/auth/refresh en tâche de fond, puis on rejoue la requête initiale.
// Si le refresh échoue (refreshToken expiré ou révoqué à la déconnexion),
// on redirige vers la page de login.
async function apiFetch(url, options = {}) {
  // Les cookies (accessToken/refreshToken httpOnly) partent automatiquement.
  const requestOptions = { ...options, credentials: "same-origin" };

  let response = await fetch(url, requestOptions);

  // JWT expiré → tentative de rafraîchissement transparent.
  if (response.status === 401) {
    console.log("[apiFetch] 401 reçu → tentative de refresh…");

    const refreshResponse = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });

    if (refreshResponse.ok) {
      console.log("[apiFetch] refresh réussi → rejeu de la requête initiale.");
      // Rejeu de la requête d'origine avec le nouvel accessToken.
      response = await fetch(url, requestOptions);
    } else {
      // refreshToken invalide/expiré/révoqué → retour au login.
      console.warn("[apiFetch] refresh échoué → redirection vers login.");
      window.location.href = "/auth/login";
    }
  }

  return response;
}

// --- Logique du tableau de bord (ne s'exécute que sur la page dashboard) ---
const userInfoEl = document.getElementById("user-info");

if (userInfoEl) {
  async function loadUserData() {
    userInfoEl.textContent = "Chargement…";
    try {
      const res = await apiFetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        userInfoEl.textContent = data.username;
      } else {
        userInfoEl.textContent = "(indisponible)";
      }
    } catch (err) {
      userInfoEl.textContent = "(erreur réseau)";
    }
  }

  // Bouton "action" pour déclencher un appel API (démo du refresh transparent).
  const refreshBtn = document.getElementById("refresh-data");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadUserData);
  }

  // Chargement initial des données utilisateur.
  loadUserData();
}
