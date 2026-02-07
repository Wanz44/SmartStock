
import { GoogleGenAI, Type } from "@google/genai";
import { Product, InventoryLog, RapportAutomatique } from "../types";

// Initialisation standard de l'API automatique
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getProfessionalReport = async (products: Product[], history: InventoryLog[]): Promise<RapportAutomatique> => {
  const prompt = `
    En tant qu'expert en Audit Logistique de classe mondiale pour une multinationale, génère un rapport de performance analytique structuré basé sur ces données :
    Produits: ${JSON.stringify(products)}
    Historique: ${JSON.stringify(history.slice(-30))}
    
    Le rapport doit être hautement professionnel. Pour chartData, suggère 5 catégories majeures de dépenses ou niveaux de stock basés sur les données.
    Inclus des données de marché actuelles si pertinent via recherche automatique.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Résumé analytique de haut niveau" },
            criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Analyse des risques critiques" },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Plan d'action stratégique" },
            financialProjection: { type: Type.STRING, description: "Prospective financière détaillée" },
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  valeur: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["summary", "criticalAlerts", "recommendations", "financialProjection", "chartData"]
        }
      }
    });

    const report = JSON.parse(response.text || '{}') as RapportAutomatique;
    report.generatedAt = new Date().toISOString();

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      report.sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    return report;
  } catch (error) {
    console.error("Erreur Rapport Automatique:", error);
    throw error;
  }
};

export const extractDataFromImage = async (base64Image: string): Promise<Partial<Product>[]> => {
  const prompt = "Extrait tous les articles d'inventaire visibles, leurs quantités et prix de cette image. Retourne un tableau JSON d'objets Product avec les propriétés : name, currentStock, unitPrice, category, unit.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              currentStock: { type: Type.NUMBER },
              unitPrice: { type: Type.NUMBER },
              category: { type: Type.STRING },
              unit: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Erreur Extraction Automatique:", error);
    return [];
  }
};

export const generateProductImage = async (description: string, size: "1K" | "2K" | "4K" = "1K") => {
  const proAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await proAi.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: `Photographie de produit professionnelle de : ${description}, fond blanc propre, éclairage de studio.` }] },
    config: {
      imageConfig: { aspectRatio: "1:1", imageSize: size }
    }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
