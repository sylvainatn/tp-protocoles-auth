// Affiche la raison de l'échec OAuth passée en query string (?error=...).
// Script externe pour respecter la CSP (script-src 'self') d'Helmet.
const params = new URLSearchParams(window.location.search);
const reason = params.get("error");
if (reason) {
  document.getElementById("reason").textContent = reason;
}
