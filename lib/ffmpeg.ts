import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export async function extractAudioFromVideo(
  videoPath: string, 
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Asegurar que el directorio de salida existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .audioCodec('libmp3lame')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('mp3')
      .output(outputPath)
      .on('end', () => {
        console.log('Audio extraction completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err);
        reject(err);
      })
      .run();
  });
}
