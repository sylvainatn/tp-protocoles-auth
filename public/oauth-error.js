const params = new URLSearchParams(window.location.search);
const reason = params.get("error");
if (reason) {
  document.getElementById("reason").textContent = reason;
}
