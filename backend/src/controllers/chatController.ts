import { Request, Response } from "express";
import { getAIResponse } from "../services/aiService";

export async function chatController(req: Request, res: Response) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const reply = await getAIResponse(message);

    return res.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("========== CHATBOT ERROR ==========");
    console.error(error);
    console.error("===================================");

    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to process your message",
    });
  }
}