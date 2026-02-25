import sqlite3 from "sqlite3";
sqlite3.verbose();

const db = new sqlite3.Database("./analytics.db", (err) => {
  if (err) console.error("Veritabanı açılamadı:", err.message);
  else console.log("SQLite veritabanı açıldı");
});

// Ziyaret tablosu
db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    visit_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consent INTEGER NOT NULL DEFAULT 0
)`);

// Quiz tablosu
db.run(`CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
)`);

// Sorular tablosu
db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answers TEXT NOT NULL,
    correct INTEGER NOT NULL,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
)`);

export default db;
