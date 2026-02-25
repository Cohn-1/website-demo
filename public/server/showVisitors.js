import db from "./db.js";

function showVisitors() {
  db.all("SELECT * FROM visitors ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("DB Hatası:", err);
      return;
    }

    console.log("Visitors:");
    rows.forEach(r => {
      console.log(
        `ID:${r.id} | IP:${r.ip_address} | User-Agent:${r.user_agent || "Yok"} | Visit Date:${r.visit_date} | Consent:${r.consent ? "Evet" : "Hayır"}`
      );
    });

    // Test scripti ise db'yi kapat
    db.close((err) => {
      if (err) console.error("DB kapanamadı:", err.message);
      else console.log("DB kapatıldı.");
    });
  });
}

showVisitors();
