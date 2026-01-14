
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client using the API key from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartCaption = async (userPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, viral-style social media caption for a video described as: "${userPrompt}". 
      Include 2-3 relevant hashtags. Keep it under 100 characters.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    // Extract text from the response using the .text property.
    return response.text?.trim() || "Amazing vibes! #pulse #video";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "New upload on Pulse! #trending";
  }
};

export const moderateContent = async (text: string): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is the following social media comment appropriate and safe for a general audience? Reply with a JSON object: {"safe": true/false}. 
      Comment: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN }
          },
          required: ["safe"]
        }
      }
    });
    // Extract text and parse the JSON response.
    const result = JSON.parse(response.text || '{"safe": true}');
    return result.safe;
  } catch (error) {
    return true; // Default to safe if API fails
  }
};
