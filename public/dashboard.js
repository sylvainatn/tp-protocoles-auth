async function apiFetch(url, options = {}) {
  const requestOptions = { ...options, credentials: "same-origin" };

  let response = await fetch(url, requestOptions);

  if (response.status === 401) {
    console.log("[apiFetch] 401 reçu → tentative de refresh…");

    const refreshResponse = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });

    if (refreshResponse.ok) {
      console.log("[apiFetch] refresh réussi → rejeu de la requête initiale.");
      response = await fetch(url, requestOptions);
    } else {
      console.warn("[apiFetch] refresh échoué → redirection vers login.");
      window.location.href = "/auth/login";
    }
  }

  return response;
}

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

  const refreshBtn = document.getElementById("refresh-data");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadUserData);
  }

  loadUserData();
}
