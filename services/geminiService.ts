
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getSmartReplies = async (messages: ChatMessage[], currentUserName: string): Promise<string[]> => {
  if (!process.env.GEMINI_API_KEY) return [];
  
  try {
    // Last few messages for context
    const context = messages.slice(-5).map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const prompt = `
      You are an AI assistant for BloodLink, a blood donation platform.
      The following is a short conversation between users. 
      Generate 3 short, helpful, and natural "Smart Reply" suggestions (in Bengali, as the platform users are primarily Bengali speakers) that the user ${currentUserName} could send next.
      Keep them under 5-6 words. 
      Return ONLY a JSON array of strings.
      
      Conversation:
      ${context}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    
    const text = response.text || '';
    
    // Extract JSON array
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error("Gemini Smart Reply Error:", error);
    return [];
  }
};
