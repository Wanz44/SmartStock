
import { GoogleGenAI } from "@google/genai";
import { Product, InventoryLog } from "../types";

/**
 * Service pour l'analyse via Gemini.
 * Utilise le modèle gemini-3-flash-preview pour une analyse rapide et automatique des stocks et de la logistique.
 */
export const getGeminiAnalysis = async (products: Product[], history: InventoryLog[]) => {
  // Initialisation avec la clé API provenant de l'environnement
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Extraction des produits en seuil critique pour limiter la taille du prompt
  const criticalProducts = products
    .filter(p => p.currentStock <= p.minStock)
    .map(p => ({ nom: p.name, stock: p.currentStock, min: p.minStock }));

  const prompt = `En tant qu'expert logistique en République Démocratique du Congo, analyse l'état des stocks suivant :
  Articles critiques: ${JSON.stringify(criticalProducts)}
  Historique récent (10 derniers flux): ${JSON.stringify(history.slice(0, 10))}
  
  Fournis une analyse flash en 3 points :
  1. Diagnostic des risques de rupture immédiate.
  2. Observation sur les tendances de consommation.
  3. Recommandation stratégique pour le réapprovisionnement.
  
  Réponds en français avec un ton professionnel et direct.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Accès direct à la propriété .text comme spécifié dans les guidelines
    return response.text || "Analyse automatique non disponible actuellement.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Erreur lors de la génération de l'analyse automatique. Vérifiez la configuration du service.";
  }
};
