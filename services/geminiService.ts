
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Product, InventoryLog, RapportAutomatique } from "../types";

// Get professional logistics report from Automatic system
export const getProfessionalReport = async (products: Product[], history: InventoryLog[]): Promise<RapportAutomatique> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    En tant qu'expert en Audit Logistique, analyse ces données :
    Produits: ${JSON.stringify(products)}
    Historique: ${JSON.stringify(history.slice(-30))}
    Génère un rapport JSON structuré avec : résumé, alertes critiques, recommandations, projection financière et données pour graphique.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            financialProjection: { type: Type.STRING },
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
    return report;
  } catch (error) {
    console.error("Erreur Rapport Automatique:", error);
    throw error;
  }
};

// Extract inventory data from documents or images using Automatic Vision with intelligent classification
export const extractDataFromFile = async (base64Data: string, mimeType: string): Promise<Partial<Product>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoriesList = [
    "Alimentaire",
    "Boisson",
    "Matériel",
    "Mobilier",
    "Décoration",
    "Informatique",
    "Autre"
  ];

  const prompt = `
    Tu es un assistant expert en gestion d'inventaire et logistique. 
    Analyse ce document ou cette image pour en extraire les données de stock.
    
    INSTRUCTION DE CLASSIFICATION CRITIQUE :
    Tu DOIS obligatoirement assigner une catégorie à chaque article extrait parmi la liste suivante : 
    [${categoriesList.join(", ")}].
    
    Même si la catégorie n'est PAS mentionnée dans le fichier, utilise ton intelligence pour déduire la catégorie la plus logique selon le nom de l'article. 
    Exemples : 
    - "Coca" ou "Eau" -> Boisson
    - "Pain" ou "Riz" -> Alimentaire
    - "Laptop" ou "Clavier" -> Informatique
    - "Table" ou "Chaise" -> Mobilier
    
    Retourne uniquement un tableau JSON d'objets : [{name, currentStock, unitPrice, category, unit}].
    Si une quantité ou un prix manque, estime une valeur par défaut cohérente (ex: 0 ou 1).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
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
              category: { 
                type: Type.STRING,
                description: "La catégorie extraite ou déduite intelligemment"
              },
              unit: { type: Type.STRING }
            },
            required: ["name", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Erreur Extraction Vision Automatique:", error);
    return [];
  }
};

// Generate high-quality product images for the studio using Automatic system
export const generateProductImage = async (description: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { 
        parts: [
          { text: `Photographie publicitaire pro d'un article de stock : ${description}, éclairage studio, fond épuré, haute résolution, netteté parfaite.` }
        ] 
      },
      config: { 
        imageConfig: { 
          aspectRatio: "1:1",
          imageSize: "1K"
        } 
      }
    });
    
    // Iterate through candidates and parts to find the image part as per guidelines
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Erreur Studio Photo Automatique:", error);
    return null;
  }
};
