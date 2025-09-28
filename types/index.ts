export interface ProcessingResponse {
  success: boolean;
  message: string;
  transcription?: string;
  gptResponse?: string;
  error?: string;
  jobId?: string;
}

export interface ProcessingStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'error';
  step: 'uploading' | 'extracting_audio' | 'transcribing' | 'generating_response' | 'completed';
  progress: number;
  message: string;
  result?: {
    transcription: string;
    gptResponse: string;
  };
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  jobId?: string;
  data?: ProcessingResponse;
  error?: string;
}