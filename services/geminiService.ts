
import { GoogleGenAI } from "@google/genai";

// Guidelines recommend creating a new instance before making an API call
// The API key must be obtained exclusively from process.env.API_KEY

/**
 * Generates the application logo using the default image generation model.
 */
export const generateAppLogo = async (): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A friendly 3D cartoon styled professional logo for a tax professional app named 'Profee'. The logo should feature a cute clay-morphism styled brief case with a rupee symbol and a magnifying glass. Minimalist, pastel blue and indigo color palette, white background, high quality 3D render.",
          },
        ],
      },
    });

    // Iterate through all parts to find the image part, as per @google/genai guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    // Gracefully handle quota exhaustion (429)
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.warn("Gemini API Quota Exhausted (429). Logo generation skipped.");
    } else {
      console.error("Logo Generation Error:", error);
    }
    return null;
  }
};

/**
 * Edits a document or image using Gemini 2.5 Flash Image.
 */
export const editImageWithAI = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Find the image part in the response candidates
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("AI Image Edit Error:", error);
    throw error;
  }
};
