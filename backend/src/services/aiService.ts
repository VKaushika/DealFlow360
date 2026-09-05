import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function getAIResponse(message: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: message,
    config: {
      systemInstruction: `
You are DealFlow360 AI Assistant.

You help users understand and manage their DealFlow360 business
information.

Be helpful, concise, professional, and easy to understand.

Do not invent information about DealFlow360 data.
If the required information is not available, say so clearly.
`,
    },
  });

  return response.text || "I couldn't generate a response.";
}