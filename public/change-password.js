const form = document.getElementById("change-password-form");
const message = document.getElementById("message");

function changePassword(oldPassword, newPassword) {
  return apiFetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.style.color = "";

  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  try {
    const res = await changePassword(oldPassword, newPassword);

    const data = await res.json().catch(() => null);

    if (res.ok) {
      message.style.color = "green";
      message.textContent =
        (data && data.message) || "Mot de passe modifié avec succès.";
      form.reset();
    } else if (res.status === 401) {
      message.style.color = "red";
      message.textContent = "Session expirée, veuillez vous reconnecter.";
    } else {
      message.style.color = "red";
      message.textContent = (data && data.error) || "Une erreur est survenue.";
    }
  } catch (err) {
    message.style.color = "red";
    message.textContent = "Impossible de contacter le serveur.";
  }
});
