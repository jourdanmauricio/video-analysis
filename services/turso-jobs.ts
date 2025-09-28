import { createClient } from "@libsql/client";
import { ProcessingStatus } from "../types";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Funciones de utilidad para trabajos
export const jobQueries = {
  // Crear trabajo
  async create(): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const now = Date.now();

    await client.execute({
      sql: `
        INSERT INTO jobs (job_id, status, step, progress, message, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        jobId,
        "processing",
        "uploading",
        0,
        "Procesando archivo de video...",
        now,
        now,
      ],
    });

    console.log(`Created job: ${jobId}`);
    return jobId;
  },

  // Actualizar estado del trabajo
  async updateStatus(
    jobId: string,
    updates: Partial<ProcessingStatus>
  ): Promise<void> {
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

    const result = await client.execute({
      sql: query,
      args: values,
    });

    if (result.rowsAffected > 0) {
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
  async getStatus(jobId: string): Promise<ProcessingStatus | undefined> {
    const result = await client.execute({
      sql: `SELECT * FROM jobs WHERE job_id = ?`,
      args: [jobId],
    });

    if (result.rows.length === 0) {
      console.log(`Job ${jobId} not found`);
      return undefined;
    }

    const row = result.rows[0];

    const status: ProcessingStatus = {
      jobId: row.job_id as string,
      status: row.status as "processing" | "completed" | "error",
      step: row.step as
        | "uploading"
        | "extracting_audio"
        | "transcribing"
        | "generating_response"
        | "completed",
      progress: row.progress as number,
      message: row.message as string,
      error: (row.error as string) || undefined,
      result:
        row.result_transcription && row.result_gpt_response
          ? {
              transcription: row.result_transcription as string,
              gptResponse: row.result_gpt_response as string,
            }
          : undefined,
    };

    console.log(`Retrieved job ${jobId}: ${status.status} - ${status.step}`);
    return status;
  },

  // Completar trabajo
  async complete(
    jobId: string,
    result: { transcription: string; gptResponse: string }
  ): Promise<void> {
    console.log(`Completing job ${jobId}`);
    await this.updateStatus(jobId, {
      status: "completed",
      step: "completed",
      progress: 100,
      message: "Procesamiento completado exitosamente",
      result,
    });
  },

  // Fallar trabajo
  async fail(jobId: string, error: string): Promise<void> {
    console.log(`Failing job ${jobId}: ${error}`);
    await this.updateStatus(jobId, {
      status: "error",
      progress: 0,
      message: "Error en el procesamiento",
      error,
    });
  },

  // Limpiar trabajos antiguos
  async cleanupOld(): Promise<void> {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const result = await client.execute({
      sql: "DELETE FROM jobs WHERE created_at < ?",
      args: [oneDayAgo],
    });

    if (result.rowsAffected > 0) {
      console.log(`Cleaned up ${result.rowsAffected} old jobs`);
    }
  },
};

// Funciones de compatibilidad (mantienen la API existente)
export async function createJob(): Promise<string> {
  return jobQueries.create();
}

export async function updateJobStatus(
  jobId: string,
  updates: Partial<ProcessingStatus>
): Promise<void> {
  await jobQueries.updateStatus(jobId, updates);
}

export async function getJobStatus(
  jobId: string
): Promise<ProcessingStatus | undefined> {
  return jobQueries.getStatus(jobId);
}

export async function completeJob(
  jobId: string,
  result: { transcription: string; gptResponse: string }
): Promise<void> {
  await jobQueries.complete(jobId, result);
}

export async function failJob(jobId: string, error: string): Promise<void> {
  await jobQueries.fail(jobId, error);
}

export async function cleanupOldJobs(): Promise<void> {
  await jobQueries.cleanupOld();
}

export async function initializeJobQueue(): Promise<void> {
  await jobQueries.cleanupOld();
  console.log("Turso job queue initialized");
}
