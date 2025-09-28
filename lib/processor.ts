import { extractAudioFromVideo } from "./ffmpeg";
import { transcribeAudio, generateGPTResponse } from "./openai";

import {
  updateJobStatus,
  completeJob,
  failJob,
  initializeJobQueue,
} from "../services/turso-jobs";
import { cleanupFile } from "./fileUtils";

// Inicializar la queue al cargar el módulo
initializeJobQueue().catch(console.error);

export async function processVideoAsync(
  jobId: string,
  videoPath: string,
  audioPath: string
  //prompt: string
): Promise<void> {
  try {
    console.log(`Starting processing job ${jobId}`);

    // Paso 1: Extraer audio
    await updateJobStatus(jobId, {
      step: "extracting_audio",
      progress: 25,
      message: "Extrayendo audio del video...",
    });

    console.log(`Extracting audio: ${videoPath} -> ${audioPath}`);
    await extractAudioFromVideo(videoPath, audioPath);
    console.log(`Audio extraction completed for job ${jobId}`);

    // Limpiar el video original ya que no lo necesitamos más
    cleanupFile(videoPath);

    // Paso 2: Transcribir audio
    await updateJobStatus(jobId, {
      step: "transcribing",
      progress: 50,
      message: "Transcribiendo audio con Whisper...",
    });

    console.log(`Starting transcription for job ${jobId}`);
    const transcription = await transcribeAudio(audioPath);
    console.log(`Transcription completed for job ${jobId}`);

    // Paso 3: Generar respuesta GPT
    await updateJobStatus(jobId, {
      step: "generating_response",
      progress: 75,
      message: "Generando respuesta con GPT-4...",
    });

    console.log(`Starting GPT response for job ${jobId}`);
    // const gptResponse = await generateGPTResponse(prompt, transcription);
    const gptResponse = await generateGPTResponse(transcription);
    // const gptResponse = "test";
    console.log(`GPT response completed for job ${jobId}`);

    // Completar job
    console.log(`Completing job ${jobId}`);
    await completeJob(jobId, { transcription, gptResponse });

    // Limpiar archivo de audio al final
    cleanupFile(audioPath);

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);

    // Marcar como fallido
    await failJob(
      jobId,
      error instanceof Error ? error.message : "Error desconocido"
    );

    // Limpiar archivos en caso de error
    cleanupFile(videoPath);
    cleanupFile(audioPath);
  }
}
