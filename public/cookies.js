function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
}
const totalCount = document.getElementById("total-visitor-count");
function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const c of cookies) {
    const [key, value] = c.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

function deleteCookie(name) {
  setCookie(name, "", -1);
}

function incrementVisitorCount() {
  let count = parseInt(getCookie("visitorCount") || "0");
  count++;
  setCookie("visitorCount", count, 365);
  return count;
}

function getVisitorCount() {
  return parseInt(getCookie("visitorCount") || "0");
}

function sendVisit(consent) {
  fetch("/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consent })
  })
  .then(res => res.json())
  .then(data => console.log("Ziyaret kaydedildi:", data))
  .catch(err => console.error("Ziyaret kaydı hatası:", err));
}


document.addEventListener("DOMContentLoaded", () => {
  const visitors = incrementVisitorCount();
  console.log(`Toplam ziyaretçi sayısı: ${visitors}`);

  const consent = getCookie("cookieConsent") === "true";
totalCount.innerHTML = `<p>Toplam Ziyaretçi Sayısı: ${visitors}</p>`;
  if (consent) {
    sendVisit(true); // onaylıysa hemen kaydet
    return;
  }

  // Banner
  const banner = document.createElement("div");
  banner.innerHTML = `
    Bu site çerez kullanır.
    <button id="acceptCookies">Kaiser Verilerinize erişmek istiyor</button>
  `;
  Object.assign(banner.style, {
    position: "fixed",
    bottom: "0",
    background: "#333",
    color: "#fff",
    padding: "10px",
    width: "100%",
    textAlign: "center",
    zIndex: "9999"
  });

  document.body.appendChild(banner);

  document.getElementById("acceptCookies").onclick = () => {
    setCookie("cookieConsent", "true", 365);
    banner.remove();
    sendVisit(true); // onay sonrası kaydet
  };
});


