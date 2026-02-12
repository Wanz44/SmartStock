import { Product, InventoryLog } from '../types';

export const getAutomatedAnalysis = async (products: Product[], history: InventoryLog[]): Promise<string> => {
  // Simuler un délai d'analyse
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Calculer des métriques réelles
  const totalProducts = products.length;
  const criticalStock = products.filter(p => p.currentStock <= p.minStock).length;
  const outOfStock = products.filter(p => p.currentStock === 0).length;
  const totalStockValue = products.reduce((acc, p) => {
    const price = p.currency === '$' ? p.unitPrice * 2800 : p.unitPrice;
    return acc + (p.currentStock * price);
  }, 0);
  
  // Mouvements récents
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const recentMovements = history.filter(h => new Date(h.date) > last30Days);
  const entryVolume = recentMovements.filter(h => h.type === 'entry').reduce((acc, h) => acc + h.changeAmount, 0);
  const exitVolume = recentMovements.filter(h => h.type === 'exit').reduce((acc, h) => acc + Math.abs(h.changeAmount), 0);
  const turnoverRatio = exitVolume > 0 ? (entryVolume / exitVolume).toFixed(2) : 'N/A';
  
  // Générer un texte d'analyse dynamique
  let analysis = "";
  
  if (totalProducts === 0) {
    analysis = "Aucun produit enregistré. Commencez par ajouter des articles à l'inventaire.";
  } else if (criticalStock > 0) {
    analysis = `Alerte patrimoniale : ${criticalStock} articles sous seuil critique dont ${outOfStock} en rupture totale. `;
    analysis += `La valeur totale du stock est estimée à ${(totalStockValue / 1000000).toFixed(1)}M Fc. `;
    analysis += `Le ratio entrées/sorties sur 30j est de ${turnoverRatio}. `;
    analysis += "Un réapprovisionnement est recommandé pour les catégories à forte rotation.";
  } else {
    analysis = `Situation saine : ${totalProducts} articles gérés, aucun sous seuil critique. `;
    analysis += `Valeur totale du stock : ${(totalStockValue / 1000000).toFixed(1)}M Fc. `;
    analysis += `Volume d'activité : ${entryVolume} entrées, ${exitVolume} sorties sur 30j. `;
    analysis += "La couverture des besoins est optimale.";
  }
  
  return analysis;
};