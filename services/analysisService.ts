
import { Product, InventoryLog } from "../types";

/**
 * Service d'analyse algorithmique déterministe (Simulant une logique Python Pro).
 * Génère des diagnostics basés sur des calculs de moyenne et corrélation.
 */
export const getAutomatedAnalysis = async (products: Product[], history: InventoryLog[]) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const totalProducts = products.length;
  const totalStockValue = products.reduce((acc, p) => {
    const price = p.currency === '$' ? p.unitPrice * 2800 : p.unitPrice;
    return acc + (p.currentStock * price);
  }, 0);
  
  const criticalProducts = products.filter(p => p.currentStock <= p.minStock);
  const outOfStock = products.filter(p => p.currentStock === 0);
  const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock);
  
  const criticalRate = totalProducts > 0 
    ? Math.round((criticalProducts.length / totalProducts) * 100) 
    : 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentMovements = history.filter(h => new Date(h.date) >= thirtyDaysAgo);
  
  const entryVolume = recentMovements
    .filter(h => h.type === 'entry')
    .reduce((acc, h) => acc + h.changeAmount, 0);
  
  const exitVolume = recentMovements
    .filter(h => h.type === 'exit')
    .reduce((acc, h) => acc + Math.abs(h.changeAmount), 0);
  
  const adjustmentVolume = recentMovements
    .filter(h => h.type === 'adjustment')
    .reduce((acc, h) => acc + Math.abs(h.changeAmount), 0);
  
  const turnoverRatio = exitVolume > 0 
    ? (entryVolume / exitVolume).toFixed(2) 
    : 'N/A';
  
  const productMovementMap = new Map<string, number>();
  recentMovements.forEach(h => {
    if (h.type === 'exit' || h.type === 'entry') {
      const current = productMovementMap.get(h.productName) || 0;
      productMovementMap.set(h.productName, current + Math.abs(h.changeAmount));
    }
  });
  
  const topProducts = Array.from(productMovementMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
  
  if (totalProducts === 0) {
    return "[STATUS_ERROR]: L'inventaire est vide. Enregistrez des données pour lancer le moteur.";
  }
  
  let analysis = "";
  analysis += `[EXECUTION_LOG]: SMARTSTOCK_CALC_ENGINE v2.5\n`;
  analysis += `[TIMESTAMP]: ${new Date().toISOString()}\n`;
  analysis += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  analysis += `[DATA_SUMMARY]:\n`;
  analysis += `   • RÉFÉRENCES ACTIVES : ${totalProducts} SKU\n`;
  analysis += `   • VALORISATION RÉSEAU : ${(totalStockValue / 1000000).toFixed(1)}M Fc\n\n`;
  
  analysis += `[RISK_DIAGNOSTIC]:\n`;
  if (outOfStock.length > 0) {
    analysis += `   • RUPTURES_DÉTECTÉES : ${outOfStock.length} article(s) à stock nul\n`;
  }
  if (lowStock.length > 0) {
    analysis += `   • SEUILS_CRITIQUES : ${lowStock.length} article(s) à réapprovisionner\n`;
  }
  if (criticalRate > 30) {
    analysis += `   • ALERT_LEVEL : CRITIQUE (${criticalRate}% du stock en péril)\n`;
  } else {
    analysis += `   • ALERT_LEVEL : STABLE (${criticalRate}% sous seuil)\n`;
  }
  analysis += `\n`;
  
  analysis += `[FLOW_CORRELATION_30D]:\n`;
  analysis += `   • VOL_ENTRÉES : +${entryVolume} unit.\n`;
  analysis += `   • VOL_SORTIES : -${exitVolume} unit.\n`;
  analysis += `   • RATIO_RENOUVELLEMENT : ${turnoverRatio}\n`;
  
  if (topProducts.length > 0) {
    analysis += `   • HOT_ZONE_PRODUCTS : ${topProducts.join(' | ')}\n`;
  }
  analysis += `\n`;
  
  analysis += `[STRATEGIC_ACTIONS]:\n`;
  
  if (outOfStock.length > 0) {
    analysis += `   • ACTION_REQUIRED : Injection immédiate de stock pour ${outOfStock.length} SKU\n`;
  }
  
  if (exitVolume > entryVolume) {
    analysis += `   • FLOW_WARNING : Taux de sortie excédentaire. Augmenter le budget appro.\n`;
  } else if (entryVolume > exitVolume * 1.5) {
    analysis += `   • OPTIMIZATION_HINT : Risque de surstockage. Réduire les cadences d'achat.\n`;
  }
  
  if (adjustmentVolume > entryVolume * 0.15) {
    analysis += `   • SECURITY_AUDIT : Volume d'écarts anormal détecté (>15% flux). Vérifier la chaîne de garde.\n`;
  }
  
  analysis += `\n[ENGINE_STATUS]: Terminé avec succès.`;
  
  return analysis;
};

function getDaysUntilNextQuarter(): number {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const nextQuarterMonth = (currentQuarter + 1) * 3;
  const nextQuarterDate = new Date(now.getFullYear(), nextQuarterMonth, 1);
  const diffTime = nextQuarterDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
