import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const audioFile = fs.createReadStream(audioPath);

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es", // Español por defecto, puedes cambiarlo
    });

    return response.text;
    // return "test";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

export async function generateGPTResponse(
  prompt: string,
  transcribedText: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente útil que analiza transcripciones de audio según las instrucciones del usuario.",
        },
        {
          role: "user",
          content: `Prompt del usuario: ${prompt}\n\nTexto transcrito del audio: ${transcribedText}\n\nPor favor, responde según las instrucciones del prompt utilizando el texto transcrito.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return (
      response.choices[0]?.message?.content ||
      "No se pudo generar una respuesta."
    );
  } catch (error) {
    console.error("Error generating GPT response:", error);
    throw error;
  }
}
