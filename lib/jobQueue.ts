import { ProcessingStatus } from "../types";
import jobsDb from "./jobs-db";

// Funciones de utilidad para trabajos
export const jobQueries = {
  // Crear trabajo
  create(): string {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const now = Date.now();

    const stmt = jobsDb.prepare(`
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
  },

  // Actualizar estado del trabajo
  updateStatus(jobId: string, updates: Partial<ProcessingStatus>): void {
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
    const stmt = jobsDb.prepare(query);
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
  },

  // Obtener estado del trabajo
  getStatus(jobId: string): ProcessingStatus | undefined {
    const stmt = jobsDb.prepare(`
      SELECT * FROM jobs WHERE job_id = ?
    `);

    const row = stmt.get(jobId) as
      | {
          job_id: string;
          status: string;
          step: string;
          progress: number;
          message: string;
          error?: string;
          result_transcription?: string;
          result_gpt_response?: string;
        }
      | undefined;

    if (!row) {
      console.log(`Job ${jobId} not found`);
      return undefined;
    }

    const status: ProcessingStatus = {
      jobId: row.job_id,
      status: row.status as "processing" | "completed" | "error",
      step: row.step as
        | "uploading"
        | "extracting_audio"
        | "transcribing"
        | "generating_response"
        | "completed",
      progress: row.progress,
      message: row.message,
      error: row.error || undefined,
      result:
        row.result_transcription && row.result_gpt_response
          ? {
              transcription: row.result_transcription,
              gptResponse: row.result_gpt_response,
            }
          : undefined,
    };

    console.log(`Retrieved job ${jobId}: ${status.status} - ${status.step}`);
    return status;
  },

  // Completar trabajo
  complete(
    jobId: string,
    result: { transcription: string; gptResponse: string }
  ): void {
    console.log(`Completing job ${jobId}`);
    this.updateStatus(jobId, {
      status: "completed",
      step: "completed",
      progress: 100,
      message: "Procesamiento completado exitosamente",
      result,
    });
  },

  // Fallar trabajo
  fail(jobId: string, error: string): void {
    console.log(`Failing job ${jobId}: ${error}`);
    this.updateStatus(jobId, {
      status: "error",
      progress: 0,
      message: "Error en el procesamiento",
      error,
    });
  },

  // Limpiar trabajos antiguos
  cleanupOld(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const stmt = jobsDb.prepare("DELETE FROM jobs WHERE created_at < ?");
    const result = stmt.run(oneDayAgo);

    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} old jobs`);
    }
  },
};

// Funciones de compatibilidad (mantienen la API existente)
// export function createJob(prompt: string): string {
export function createJob(): string {
  return jobQueries.create();
}

export function updateJobStatus(
  jobId: string,
  updates: Partial<ProcessingStatus>
): void {
  jobQueries.updateStatus(jobId, updates);
}

export function getJobStatus(jobId: string): ProcessingStatus | undefined {
  return jobQueries.getStatus(jobId);
}

export function completeJob(
  jobId: string,
  result: { transcription: string; gptResponse: string }
): void {
  jobQueries.complete(jobId, result);
}

export function failJob(jobId: string, error: string): void {
  jobQueries.fail(jobId, error);
}

export function cleanupOldJobs(): void {
  jobQueries.cleanupOld();
}

export function initializeJobQueue(): void {
  jobQueries.cleanupOld();
  console.log("SQLite job queue initialized");
}
