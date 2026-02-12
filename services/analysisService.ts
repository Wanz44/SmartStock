import { Product, InventoryLog } from "../types";

/**
 * Service d'analyse automatique des données d'inventaire.
 * Génère des diagnostics et recommandations basés sur des calculs réels.
 */
export const getAutomatedAnalysis = async (products: Product[], history: InventoryLog[]) => {
  // Simuler un délai de traitement (realiste)
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // ============================================
  // 1. MÉTRIQUES DE BASE
  // ============================================
  const totalProducts = products.length;
  const totalStockValue = products.reduce((acc, p) => {
    const price = p.currency === '$' ? p.unitPrice * 2800 : p.unitPrice;
    return acc + (p.currentStock * price);
  }, 0);
  
  // ============================================
  // 2. ANALYSE DES SEUILS CRITIQUES
  // ============================================
  const criticalProducts = products.filter(p => p.currentStock <= p.minStock);
  const outOfStock = products.filter(p => p.currentStock === 0);
  const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock);
  
  const criticalRate = totalProducts > 0 
    ? Math.round((criticalProducts.length / totalProducts) * 100) 
    : 0;
  
  // ============================================
  // 3. ANALYSE DES MOUVEMENTS (30 derniers jours)
  // ============================================
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
  
  // ============================================
  // 4. PRODUITS LES PLUS DYNAMIQUES
  // ============================================
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
  
  // ============================================
  // 5. GÉNÉRATION DU RAPPORT TEXTUEL
  // ============================================
  
  // Cas 1 : Aucune donnée
  if (totalProducts === 0) {
    return "📊 AUCUNE DONNÉE - L'inventaire est vide. Commencez par créer des sites et ajouter des produits.";
  }
  
  // Cas 2 : Données présentes
  let analysis = "";
  
  // Introduction
  analysis += `🔍 ANALYSE AUTOMATIQUE DU PATRIMOINE\n`;
  analysis += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  analysis += `📦 INVENTAIRE : ${totalProducts} produits actifs\n`;
  analysis += `💰 VALORISATION : ${(totalStockValue / 1000000).toFixed(1)}M Fc\n\n`;
  
  // Section risques
  analysis += `⚠️  DIAGNOSTIC DES RISQUES\n`;
  if (outOfStock.length > 0) {
    analysis += `   • RUPTURE TOTALE : ${outOfStock.length} article(s) en stock zéro\n`;
  }
  if (lowStock.length > 0) {
    analysis += `   • SEUIL CRITIQUE : ${lowStock.length} article(s) sous le minimum\n`;
  }
  if (criticalRate > 30) {
    analysis += `   • ALERTE : ${criticalRate}% des articles sont sous seuil critique\n`;
  }
  if (outOfStock.length === 0 && lowStock.length === 0) {
    analysis += `   • AUCUN RISQUE DÉTECTÉ - Tous les stocks sont conformes\n`;
  }
  analysis += `\n`;
  
  // Section tendances
  analysis += `📈 TENDANCES DE CONSOMMATION (30j)\n`;
  analysis += `   • ENTRÉES : +${entryVolume} unités\n`;
  analysis += `   • SORTIES : -${exitVolume} unités\n`;
  analysis += `   • AJUSTEMENTS : ${adjustmentVolume} unités\n`;
  analysis += `   • RATIO E/S : ${turnoverRatio}\n`;
  
  if (topProducts.length > 0) {
    analysis += `   • PRODUITS ACTIFS : ${topProducts.join(', ')}\n`;
  }
  analysis += `\n`;
  
  // Section recommandations
  analysis += `💡 STRATÉGIE DE RÉAPPROVISIONNEMENT\n`;
  
  if (outOfStock.length > 0) {
    analysis += `   • PRIORITÉ 1 : Réapprovisionner immédiatement ${outOfStock.length} article(s) en rupture\n`;
  }
  if (lowStock.length > 0) {
    analysis += `   • PRIORITÉ 2 : Commander ${lowStock.length} article(s) sous seuil critique\n`;
  }
  
  if (exitVolume > entryVolume) {
    analysis += `   • ALERTE FLUX : Sorties > Entrées - Risque de déstockage accéléré\n`;
    analysis += `   • ACTION : Augmenter les approvisionnements de ${Math.round((exitVolume - entryVolume) / 10) * 10}+ unités\n`;
  } else if (entryVolume > exitVolume * 1.2) {
    analysis += `   • SURSTOCKAGE : Entrées très supérieures aux sorties\n`;
    analysis += `   • ACTION : Vérifier la rotation et ajuster les commandes\n`;
  }
  
  if (adjustmentVolume > entryVolume * 0.1) {
    analysis += `   • ÉCARTS D'AUDIT : Volume d'ajustements anormal (${adjustmentVolume} unités)\n`;
    analysis += `   • ACTION : Programmer un inventaire physique ciblé\n`;
  }
  
  if (outOfStock.length === 0 && lowStock.length === 0 && entryVolume >= exitVolume) {
    analysis += `   • SITUATION OPTIMALE : Maintenir le rythme actuel\n`;
    analysis += `   • PROCHAINE ÉCHÉANCE : Audit trimestriel dans ${getDaysUntilNextQuarter()} jours\n`;
  }
  
  return analysis;
};

/**
 * Calcule le nombre de jours jusqu'au prochain trimestre
 */
function getDaysUntilNextQuarter(): number {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const nextQuarterMonth = (currentQuarter + 1) * 3;
  const nextQuarterDate = new Date(now.getFullYear(), nextQuarterMonth, 1);
  const diffTime = nextQuarterDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
  }
};
