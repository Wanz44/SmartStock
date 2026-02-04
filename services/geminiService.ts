
import { GoogleGenAI, Type } from "@google/genai";
import { Product, InventoryLog } from "../types";

// Always use named parameter for apiKey and get it from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStockInsights = async (products: Product[], history: InventoryLog[]) => {
  const prompt = `
    En tant qu'expert en logistique, analyse cet inventaire :
    ${JSON.stringify(products, null, 2)}
    
    Et l'historique récent :
    ${JSON.stringify(history.slice(-10), null, 2)}
    
    Tâches :
    1. Identifie les produits en rupture critique.
    2. Suggère les quantités à commander pour atteindre les objectifs mensuels.
    3. Prédit si certains produits seront en rupture bientôt basé sur l'historique.
    
    Réponds en français avec un ton professionnel et structuré.
  `;

  try {
    // Using gemini-3-flash-preview for summarization and analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property to get the generated content (not a method call)
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Désolé, je ne peux pas analyser vos stocks pour le moment.";
  }
};

export const processImportedData = async (rawText: string, existingCategories: string[]) => {
  const prompt = `
    Tu es un expert en traitement de données logistiques. Voici un contenu brut issu d'un fichier Excel/CSV :
    """
    ${rawText}
    """
    
    Voici les catégories autorisées dans notre système : ${existingCategories.join(", ")}.
    
    Tâche : Transforme ce texte en un tableau JSON d'objets "Product". 
    Pour chaque produit :
    - "name": nom du produit.
    - "category": assigne la catégorie la plus logique parmi la liste autorisée.
    - "currentStock": nombre (0 si non trouvé).
    - "minStock": nombre (défaut 10).
    - "monthlyNeed": nombre (défaut 10).
    - "unit": string (ex: 'unités', 'kg', 'sacs').
    - "unitPrice": nombre.
    - "currency": '$' ou 'Fc'.
    - "supplier": nom du fournisseur si détecté.
    
    RETOURNE UNIQUEMENT LE JSON PUR (TABLEAU D'OBJETS).
  `;

  try {
    // Configured with responseSchema for robust JSON extraction as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              currentStock: { type: Type.NUMBER },
              minStock: { type: Type.NUMBER },
              monthlyNeed: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              unitPrice: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              supplier: { type: Type.STRING },
            },
            required: ["name", "category", "currentStock"]
          }
        }
      }
    });
    
    // Use .text property and trim for safety
    const text = response.text || "[]";
    return JSON.parse(text.trim()) as Partial<Product>[];
  } catch (error) {
    console.error("AI Import Error:", error);
    throw new Error("L'IA n'a pas pu structurer les données. Vérifiez le format du fichier.");
  }
};
