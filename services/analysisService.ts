
import { GoogleGenAI } from "@google/genai";
import { Product, InventoryLog } from "../types";

/**
 * Service d'analyse algorithmique de données.
 * Utilise un moteur de traitement haute performance pour générer des diagnostics logistiques automatiques.
 */
export const getAutomatedAnalysis = async (products: Product[], history: InventoryLog[]) => {
  // Initialisation du moteur de calcul via clé sécurisée
  const engine = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const criticalProducts = products
    .filter(p => p.currentStock <= p.minStock)
    .map(p => ({ nom: p.name, stock: p.currentStock, min: p.minStock }));

  const scriptQuery = `Analyse algorithmique des stocks :
  Données critiques: ${JSON.stringify(criticalProducts)}
  Historique des flux: ${JSON.stringify(history.slice(0, 10))}
  
  Génère un rapport technique en 3 points :
  1. Diagnostic des risques de rupture.
  2. Statistiques sur les tendances de consommation.
  3. Stratégie de réapprovisionnement préconisée par l'algorithme.
  
  Format de réponse : Français, ton technique, professionnel et direct.`;

  try {
    const result = await engine.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: scriptQuery,
    });
    return result.text || "Le script d'analyse n'a pas pu retourner de données.";
  } catch (error) {
    console.error("Analysis Script Error:", error);
    return "Erreur lors de l'exécution du script d'analyse automatique.";
  }
};
