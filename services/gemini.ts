import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
// Note: In production, proxy this through a backend to protect the API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const generateProductDescription = async (
  name: string, 
  category: string, 
  keywords: string
): Promise<string> => {
  try {
    // Check if API key exists
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn("Gemini API key not configured");
      return "A stunning addition to your wardrobe, crafted with premium materials and attention to detail.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Write a compelling, sophisticated product description for a high-end women's fashion item.
    Product Name: ${name}
    Category: ${category}
    Keywords/Features: ${keywords}
    
    Style: Minimalist, elegant, luxury, empowering.
    Format: A single paragraph under 60 words. No markdown, just text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text || "A stunning addition to your wardrobe, crafted with premium materials and attention to detail.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "A stunning addition to your wardrobe, crafted with premium materials and attention to detail.";
  }
};