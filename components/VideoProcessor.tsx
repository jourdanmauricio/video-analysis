"use client";

import { useCallback, useEffect, useState } from "react";

import type { ProcessingResponse, ProcessingStatus } from "@/types";
import ReactMarkdown from "react-markdown";

const VideoProcessor: React.FC = () => {
  const [video, setVideo] = useState<File | null>(null);
  // const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ProcessingStatus | null>(null);
  const [result, setResult] = useState<ProcessingResponse | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Función para agregar logs de debug
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev.slice(-10), `[${timestamp}] ${message}`]);
    console.log(`[VideoProcessor] ${message}`);
  }, []);

  const handleVideoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setVideo(file);

        // Validar tamaño del archivo
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
          alert(
            `El archivo es demasiado grande. Máximo permitido: 500MB. Tamaño actual: ${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB`
          );
          setVideo(null);
          e.target.value = "";
        }
      }
    },
    []
  );

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      try {
        addDebugLog(`Polling job status for: ${jobId}`);
        const response = await fetch(`/api/job-status?jobId=${jobId}`);

        if (!response.ok) {
          addDebugLog(`Poll failed with status: ${response.status}`);
          return;
        }

        const status: ProcessingStatus = await response.json();
        addDebugLog(
          `Received status: ${status.status}, step: ${status.step}, progress: ${status.progress}%`
        );

        setJobStatus(status);

        if (status.status === "completed" && status.result) {
          addDebugLog("Job completed successfully!");
          setResult({
            success: true,
            message: status.message,
            transcription: status.result.transcription,
            gptResponse: status.result.gptResponse,
          });
          setIsProcessing(false);
          setJobId(null);
        } else if (status.status === "error") {
          addDebugLog(`Job failed: ${status.error}`);
          setResult({
            success: false,
            message: status.message,
            error: status.error,
          });
          setIsProcessing(false);
          setJobId(null);
        }
      } catch (error) {
        addDebugLog(`Error polling job status: ${error}`);
        console.error("Error polling job status:", error);
      }
    },
    [addDebugLog]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (jobId && isProcessing) {
      addDebugLog(`Starting polling for job: ${jobId}`);

      // Poll inmediatamente
      pollJobStatus(jobId);

      // Luego poll cada 2 segundos
      interval = setInterval(() => {
        pollJobStatus(jobId);
      }, 2000);
    }

    return () => {
      if (interval) {
        addDebugLog("Stopping polling interval");
        clearInterval(interval);
      }
    };
  }, [jobId, isProcessing, addDebugLog, pollJobStatus]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!video) {
        // if (!video || !prompt.trim()) {
        alert("Por favor selecciona un video y escribe un prompt");
        return;
      }

      setIsProcessing(true);
      setResult(null);
      setJobStatus(null);
      setDebugLogs([]);
      addDebugLog("Starting video upload...");

      try {
        const formData = new FormData();
        formData.append("video", video);
        // formData.append("prompt", prompt);

        addDebugLog("Sending request to /api/process-video");
        const response = await fetch("/api/process-video", {
          method: "POST",
          body: formData,
        });

        const data: ProcessingResponse = await response.json();
        addDebugLog(`Response received: ${JSON.stringify(data)}`);

        if (data.success && data.jobId) {
          addDebugLog(`Job created with ID: ${data.jobId}`);
          setJobId(data.jobId);
          // El polling se iniciará automáticamente por el useEffect
        } else {
          addDebugLog("Job creation failed");
          setResult(data);
          setIsProcessing(false);
        }
      } catch (error) {
        addDebugLog(`Submit error: ${error}`);
        console.error("Error:", error);
        setResult({
          success: false,
          message: "Error de conexión",
          error: "No se pudo conectar con el servidor",
        });
        setIsProcessing(false);
      }
    },
    [video, addDebugLog]
    // [video, prompt, addDebugLog]
  );

  const getProgressColor = useCallback((step: string) => {
    switch (step) {
      case "uploading":
        return "bg-blue-500";
      case "extracting_audio":
        return "bg-yellow-500";
      case "transcribing":
        return "bg-purple-500";
      case "generating_response":
        return "bg-green-500";
      case "completed":
        return "bg-green-600";
      default:
        return "bg-blue-500";
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setVideo(null);
    // setPrompt("");
    setJobStatus(null);
    setDebugLogs([]);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Procesador de Video con IA
      </h1>

      {/* Debug Panel */}
      {/* {debugLogs.length > 0 && (
        <div className="mb-6 p-4 bg-gray-100 border rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">🐛 Debug Logs:</h3>
          <div className="text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div
                key={index}
                className="py-1 border-b border-gray-200 last:border-0"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )} */}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">
          📝 Información Importante:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tamaño máximo de archivo: 500MB</li>
          <li>• Formatos soportados: MP4, AVI, MOV, MKV, WEBM</li>
          <li>• El procesamiento puede tomar varios minutos</li>
          <li>• No cierres esta ventana durante el procesamiento</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="video" className="block text-sm font-medium mb-2">
            Seleccionar Video
          </label>
          <input
            type="file"
            id="video"
            accept="video/*"
            onChange={handleVideoChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {video && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Archivo: {video.name}</p>
              <p>Tamaño: {(video.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>
                Duración estimada: ~
                {Math.ceil((video.size / (1024 * 1024)) * 0.1)} minutos
              </p>
            </div>
          )}
        </div>

        {/* <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Prompt para GPT-4
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder="Ejemplo: Resume los puntos principales del video, identifica las ideas clave y proporciona un análisis crítico del contenido..."
            rows={4}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Sé específico en tus instrucciones para obtener mejores resultados
          </p>
        </div> */}

        <button
          type="submit"
          // disabled={isProcessing || !video || !prompt.trim()}
          disabled={isProcessing || !video}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? "Procesando..." : "Procesar Video"}
        </button>
      </form>

      {/* Status Display */}
      {jobId && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm">
            <strong>Job ID:</strong> {jobId}
          </p>
          <p className="text-sm">
            <strong>Status:</strong>{" "}
            {jobStatus ? jobStatus.status : "Iniciando..."}
          </p>
          <p className="text-sm">
            <strong>Progress:</strong> {jobStatus ? jobStatus.progress : 0}%
          </p>
        </div>
      )}

      {isProcessing && jobStatus && (
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Progreso del Procesamiento
            </h3>
            <span className="text-sm text-gray-500">{jobStatus.progress}%</span>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                  jobStatus.step
                )}`}
                style={{ width: `${jobStatus.progress}%` }}
              ></div>
            </div>
          </div>

          {/* <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Estado:</strong> {jobStatus.message}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Paso actual:</strong>{" "}
              {jobStatus.step === "extracting_audio"
                ? "Extrayendo audio del video"
                : jobStatus.step === "transcribing"
                ? "Transcribiendo audio con Whisper"
                : jobStatus.step === "generating_response"
                ? "Generando respuesta con GPT-4"
                : jobStatus.step === "completed"
                ? "Completado"
                : "Procesando"}
            </p>
          </div> */}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          {result.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-medium text-green-800 mb-4">
                ✅ Procesamiento Completado
              </h3>

              <div className="space-y-6">
                {/* <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    🎵 Transcripción del Audio:
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {result.transcription}
                    </p>
                  </div>
                </div> */}

                {/* <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    🤖 Análisis:
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {result.gptResponse}
                    </div>
                  </div>
                </div> */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    🤖 Análisis:
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                    <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mb-3 text-gray-900">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-md font-semibold mb-2 text-gray-800">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="mb-3 text-gray-700">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc ml-6 mb-3">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="mb-1">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {result.gptResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-green-200">
                <button
                  onClick={handleReset}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Procesar Otro Video
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                ❌ Error en el Procesamiento
              </h3>
              <p className="text-red-700 mb-2">{result.message}</p>
              {result.error && (
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-sm text-red-800">
                    <strong>Detalles técnicos:</strong> {result.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoProcessor;
