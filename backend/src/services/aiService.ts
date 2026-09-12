import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function getBuiltInAnswer(message: string): string {
  const question = message.toLowerCase().replace(/[?!.]/g, '');

  if (question.includes('silver') && (question.includes('discount') || question.includes('off'))) {
    return 'Silver members can receive up to 10% discount. The final discount may depend on the product category and approval rules.';
  }

  if (question.includes('gold') && (question.includes('discount') || question.includes('off'))) {
    return 'Gold members can receive up to 15% discount. Higher discounts may need approval.';
  }

  if (question.includes('bronze') && (question.includes('discount') || question.includes('off'))) {
    return 'Bronze members can receive up to 5% discount. Higher discounts may need approval.';
  }

  if (question.includes('generate') && question.includes('quotation')) {
    return 'Open Customer Portal and click Generate Quotation. Select products, set quantities, add notes, and send the request for review.';
  }

  if (question.includes('confirm') || question.includes('accept')) {
    return 'Open an approved quotation, review the items and total, then click Accept & Confirm. After confirmation, you can generate and download the bill.';
  }

  if (question.includes('bill') || question.includes('invoice')) {
    return 'After confirming an approved quotation, click Generate Bill & Download. Your customer bill will download to your browser.';
  }

  if (question.includes('portal') || question.includes('quotation')) {
    return 'The Customer Portal lets you request quotations, review pricing, send counter-offers, confirm approved quotations, and download bills.';
  }

  return 'I can help with discount limits, quotations, confirmation, and billing. Try asking: “How much discount does a Silver member get?”';
}

export async function getAIResponse(message: string): Promise<string> {
  if (!ai) {
    return getBuiltInAnswer(message);
  }

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