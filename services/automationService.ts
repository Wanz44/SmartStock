
import { Product, InventoryLog, RapportAutomatique } from "../types";

/**
 * Génère un rapport d'audit logistique basé sur des algorithmes statistiques.
 * Remplace l'ancien moteur IA par une analyse de données déterministe.
 */
export const getAutomatedReport = async (products: Product[], history: InventoryLog[], exchangeRate: number): Promise<RapportAutomatique> => {
  const totalValue = products.reduce((acc, p) => {
    const price = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
    return acc + (p.currentStock * price);
  }, 0);

  const criticalItems = products.filter(p => p.currentStock <= p.minStock);
  const outOfStock = products.filter(p => p.currentStock === 0);
  
  // Analyse par catégorie pour le graphique
  const categoryData: Record<string, number> = {};
  products.forEach(p => {
    const price = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
    categoryData[p.category] = (categoryData[p.category] || 0) + (p.currentStock * price);
  });

  const chartData = Object.entries(categoryData).map(([label, valeur]) => ({ label, valeur }));

  // Génération des recommandations par règles métier
  const recommendations = [
    "Optimiser les cycles de commande pour les articles en zone critique.",
    "Réviser les stocks de sécurité basés sur la consommation des 30 derniers jours.",
    "Vérifier l'intégrité physique du mobilier pour les actifs marqués 'Usés'.",
    `Ajuster les prix de vente suite à la mise à jour du taux (actuellement ${exchangeRate} Fc).`
  ];

  // Construction du résumé automatique
  const summary = `L'audit actuel identifie ${products.length} références actives pour une valeur totale de ${totalValue.toLocaleString()} Fc. Le système détecte ${criticalItems.length} alertes de réapprovisionnement dont ${outOfStock.length} ruptures sèches nécessitant une action immédiate.`;

  return {
    summary,
    criticalAlerts: criticalItems.map(p => `Alerte Seuil : ${p.name} (${p.currentStock} ${p.unit} restants)`),
    recommendations,
    financialProjection: `Basé sur les flux, une provision de ${(totalValue * 0.15).toLocaleString()} Fc est recommandée pour le prochain cycle de réapprovisionnement.`,
    chartData,
    generatedAt: new Date().toISOString()
  };
};

/**
 * Parseur de données pour l'importation automatique.
 * Analyse les chaînes de caractères (CSV/TSV) pour extraire les données d'inventaire.
 */
export const parseInventoryData = (text: string): Partial<Product>[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  return lines.map(line => {
    const parts = line.split(/[;,\t]/);
    return {
      name: parts[0]?.trim() || "Article Sans Nom",
      currentStock: parseInt(parts[1]) || 0,
      unitPrice: parseFloat(parts[2]) || 0,
      category: parts[3]?.trim() || "Autre",
      unit: parts[4]?.trim() || "pces",
      currency: 'Fc'
    };
  });
};
