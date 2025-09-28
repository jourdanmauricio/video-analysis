import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { createJob } from "@/services/turso-jobs";
import { processVideoAsync } from "@/lib/processor";
import { ensureDirectoryExists, generateUniqueFilename } from "@/lib/fileUtils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Configurar directorios
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const tempDir = process.env.TEMP_DIR || "./temp";

    ensureDirectoryExists(uploadDir);
    ensureDirectoryExists(tempDir);

    // Parsear el form data
    const formData = await req.formData();

    // const prompt = formData.get("prompt") as string;
    const videoFile = formData.get("video") as File;

    if (!videoFile) {
      // if (!prompt || !videoFile) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan el prompt o el archivo de video",
        },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/mkv",
      "video/webm",
    ];
    if (!allowedTypes.includes(videoFile.type || "")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tipo de archivo no válido. Se permiten: MP4, AVI, MOV, MKV, WEBM",
        },
        { status: 400 }
      );
    }

    // Crear job para procesamiento asíncrono
    // const jobId = createJob(prompt);
    const jobId = await createJob();

    // Guardar el archivo de video
    const videoFilename = generateUniqueFilename(videoFile.name);
    const videoPath = path.join(uploadDir, videoFilename);

    // Convertir File a Buffer y guardarlo
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(videoPath, buffer);

    // Configurar paths
    const audioFilename = generateUniqueFilename("audio.mp3");
    const audioPath = path.join(tempDir, audioFilename);

    // Iniciar procesamiento asíncrono (no esperar)
    // processVideoAsync(jobId, videoPath, audioPath, prompt).catch(console.error);
    processVideoAsync(jobId, videoPath, audioPath).catch(console.error);

    // Devolver inmediatamente el job ID
    return NextResponse.json(
      {
        success: true,
        message: "Video enviado para procesamiento",
        jobId,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error starting video processing:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error iniciando el procesamiento del video",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
