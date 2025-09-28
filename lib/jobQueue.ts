import { ProcessingStatus } from "../types";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ruta de la base de datos
const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "jobs.db");

let db: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (!db) {
    // Asegurar que el directorio existe
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);

    // Crear tabla si no existe
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

    console.log("SQLite database initialized");
  }

  return db;
}

export function createJob(prompt: string): string {
  const jobId = `job_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
  const now = Date.now();

  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO jobs (job_id, status, step, progress, message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    jobId,
    "processing",
    "uploading",
    0,
    "Procesando archivo de video...",
    now,
    now
  );

  console.log(`Created job: ${jobId}`);
  return jobId;
}

export function updateJobStatus(
  jobId: string,
  updates: Partial<ProcessingStatus>
): void {
  const db = getDatabase();
  const now = Date.now();

  // Construir la query dinámicamente
  const fields = [];
  const values = [];

  if (updates.status) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.step) {
    fields.push("step = ?");
    values.push(updates.step);
  }
  if (updates.progress !== undefined) {
    fields.push("progress = ?");
    values.push(updates.progress);
  }
  if (updates.message) {
    fields.push("message = ?");
    values.push(updates.message);
  }
  if (updates.error) {
    fields.push("error = ?");
    values.push(updates.error);
  }
  if (updates.result) {
    fields.push("result_transcription = ?", "result_gpt_response = ?");
    values.push(updates.result.transcription, updates.result.gptResponse);
  }

  fields.push("updated_at = ?");
  values.push(now);

  values.push(jobId); // Para el WHERE

  const query = `UPDATE jobs SET ${fields.join(", ")} WHERE job_id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(...values);

  if (result.changes > 0) {
    console.log(
      `Updated job ${jobId}: ${updates.step || "unknown"} - ${
        updates.progress || 0
      }%`
    );
  } else {
    console.warn(`Job ${jobId} not found for update`);
  }
}

export function getJobStatus(jobId: string): ProcessingStatus | undefined {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM jobs WHERE job_id = ?
  `);

  const row = stmt.get(jobId) as any;

  if (!row) {
    console.log(`Job ${jobId} not found`);
    return undefined;
  }

  const status: ProcessingStatus = {
    jobId: row.job_id,
    status: row.status,
    step: row.step,
    progress: row.progress,
    message: row.message,
    error: row.error || undefined,
    result: row.result_transcription
      ? {
          transcription: row.result_transcription,
          gptResponse: row.result_gpt_response,
        }
      : undefined,
  };

  console.log(`Retrieved job ${jobId}: ${status.status} - ${status.step}`);
  return status;
}

export function completeJob(
  jobId: string,
  result: { transcription: string; gptResponse: string }
): void {
  console.log(`Completing job ${jobId}`);
  updateJobStatus(jobId, {
    status: "completed",
    step: "completed",
    progress: 100,
    message: "Procesamiento completado exitosamente",
    result,
  });
}

export function failJob(jobId: string, error: string): void {
  console.log(`Failing job ${jobId}: ${error}`);
  updateJobStatus(jobId, {
    status: "error",
    progress: 0,
    message: "Error en el procesamiento",
    error,
  });
}

export function cleanupOldJobs(): void {
  const db = getDatabase();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const stmt = db.prepare("DELETE FROM jobs WHERE created_at < ?");
  const result = stmt.run(oneDayAgo);

  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} old jobs`);
  }
}

export function initializeJobQueue(): void {
  getDatabase(); // Inicializar la DB
  cleanupOldJobs();
  console.log("SQLite job queue initialized");
}

// Cerrar la base de datos al terminar el proceso
process.on("exit", () => {
  if (db) {
    db.close();
  }
});
