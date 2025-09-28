import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "jobs.db");
const db = new Database(dbPath);

// Crear tabla jobs si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    step TEXT NOT NULL,
    progress INTEGER NOT NULL,
    message TEXT NOT NULL,
    result_transcription TEXT,
    result_gpt_response TEXT,
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

export default db;
