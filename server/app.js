import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());


// =========================
// Ziyaret kayıtları
// =========================
app.post("/visit", (req, res) => {
  const user_agent = req.headers["user-agent"] || "";
  const consent = req.body.consent ? 1 : 0;

  const ip_address =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  db.run(
    `INSERT INTO visitors (ip_address, user_agent, consent) VALUES (?, ?, ?)`,
    [ip_address, user_agent, consent],
    function (err) {
      if (err) return res.status(500).json({ error: "DB hatası" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get("/visitors", (req, res) => {
  db.all("SELECT * FROM visitors ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB hatası" });
    const formatted = rows.map((r) => ({
      id: r.id,
      ip: r.ip_address,
      user_agent: r.user_agent,
      visit_date: r.visit_date,
      consent: r.consent ? "Evet" : "Hayır",
    }));
    res.json(formatted);
  });
});

// =========================
// Quiz API
// =========================



// Belirli bir quiz'e yeni soru ekleme
// Yeni quiz oluştur
app.post("/quizzes", (req, res) => {
  const { name, questions } = req.body;
  if (!name) return res.status(400).json({ error: "Quiz adı gerekli" });

  db.run(
    "INSERT INTO quizzes (name) VALUES (?)",
    [name],
    function (err) {
      if (err) return res.status(500).json({ error: "DB hatası" });

      const newQuizId = this.lastID;

      // Eğer questions dizisi varsa, onları da ekle
      if (Array.isArray(questions) && questions.length > 0) {
        const stmt = db.prepare(
          "INSERT INTO questions (quiz_id, question, answers, correct) VALUES (?, ?, ?, ?)"
        );
        questions.forEach((q) =>
          stmt.run(newQuizId, q.question, JSON.stringify(q.answers), q.correct)
        );
        stmt.finalize();
      }

      res.json({ id: newQuizId, name, questions: questions || [] });
    }
  );
});

app.get("/quizzes", (req, res) => {
  db.all("SELECT * FROM quizzes", [], (err, quizzes) => {
    if (err) return res.status(500).json({ error: err.message });

    const promises = quizzes.map(
      (q) =>
        new Promise((resolve, reject) => {
          db.all(
            "SELECT * FROM questions WHERE quiz_id = ?",
            [q.id],
            (err, questions) => {
              if (err) reject(err);
              else {
                questions = questions.map((ques) => ({
                  id: ques.id,
                  question: ques.question,
                  answers: JSON.parse(ques.answers),
                  correct: ques.correct,
                }));
                resolve({ id: q.id, name: q.name, questions });
              }
            }
          );
        })
    );

    Promise.all(promises)
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ error: err.message }));
  });
});

app.use(express.static("../public"));


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
