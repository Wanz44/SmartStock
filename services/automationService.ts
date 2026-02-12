import { Product, InventoryLog, RapportAutomatique, Site } from "../types";

export const getAutomatedReport = async (
  products: Product[], 
  history: InventoryLog[], 
  exchangeRate: number, 
  sites: Site[]
): Promise<RapportAutomatique> => {
  // Simuler un délai de calcul réaliste
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(now.getDate() - 90);

  // 1. Valeur actuelle par catégorie & site
  const categoryData: Record<string, number> = {};
  const siteValueData: Record<string, number> = {};
  
  products.forEach(p => {
    const priceFc = p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice;
    const value = p.currentStock * priceFc;
    
    categoryData[p.category] = (categoryData[p.category] || 0) + value;
    const siteName = sites.find(s => s.id === p.siteId)?.name || 'Site inconnu';
    siteValueData[siteName] = (siteValueData[siteName] || 0) + value;
  });

  // 2. Dépenses (sorties) par mois, site et produit
  const monthlyExpenses: Record<string, number> = {};
  const siteExpenses: Record<string, number> = {};
  const productConsumption: Record<string, number> = {};

  history.forEach(h => {
    const hDate = new Date(h.date);
    if (hDate >= ninetyDaysAgo && (h.type === 'exit' || (h.type === 'adjustment' && h.changeAmount < 0))) {
      const product = products.find(p => p.id === h.productId);
      const priceFc = product ? (product.currency === '$' ? product.unitPrice * exchangeRate : product.unitPrice) : 0;
      const expenseValue = Math.abs(h.changeAmount) * priceFc;
      const volume = Math.abs(h.changeAmount);

      // Par mois
      const monthKey = hDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + expenseValue;

      // Par site
      const siteName = sites.find(s => s.id === h.siteId)?.name || 'Site inconnu';
      siteExpenses[siteName] = (siteExpenses[siteName] || 0) + expenseValue;

      // Par produit (Volume)
      productConsumption[h.productName] = (productConsumption[h.productName] || 0) + volume;
    }
  });

  // 3. Indicateurs de santé par site
  const healthIndicators = sites.map(site => {
    const siteProds = products.filter(p => p.siteId === site.id);
    if (siteProds.length === 0) return { 
      siteName: site.name, 
      status: 'green' as const, 
      score: 100 
    };
    
    const criticals = siteProds.filter(p => p.currentStock <= p.minStock).length;
    const outOfStock = siteProds.filter(p => p.currentStock === 0).length;
    
    let healthScore = 100 - (criticals / siteProds.length) * 100;
    healthScore -= outOfStock * 5; // Pénalité supplémentaire pour les ruptures
    
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    
    return {
      siteName: site.name,
      status: healthScore >= 80 ? 'green' as const : 
              healthScore >= 50 ? 'orange' as const : 'red' as const,
      score: healthScore
    };
  });

  // 4. Analyse du Bilan (Entrées vs Sorties sur 30 jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  let totalIn = 0;
  let totalOut = 0;

  history.forEach(h => {
    if (new Date(h.date) >= thirtyDaysAgo) {
      const product = products.find(p => p.id === h.productId);
      const priceFc = product ? (product.currency === '$' ? product.unitPrice * exchangeRate : product.unitPrice) : 0;
      const val = Math.abs(h.changeAmount) * priceFc;
      if (h.type === 'entry') totalIn += val;
      if (h.type === 'exit') totalOut += val;
    }
  });

  const isPositive = totalIn >= totalOut;
  const balanceRatio = totalOut === 0 ? 100 : Math.round((totalIn / totalOut) * 100);

  // 5. Données par défaut pour les graphiques (évite les écrans vides)
  const defaultMonthData = [
    { label: "Jan", valeur: 0 },
    { label: "Fév", valeur: 0 },
    { label: "Mar", valeur: 0 },
    { label: "Avr", valeur: 0 },
    { label: "Mai", valeur: 0 },
    { label: "Juin", valeur: 0 },
    { label: "Juil", valeur: 0 },
    { label: "Aoû", valeur: 0 },
    { label: "Sep", valeur: 0 },
    { label: "Oct", valeur: 0 },
    { label: "Nov", valeur: 0 },
    { label: "Déc", valeur: 0 }
  ].slice(-6); // 6 derniers mois

  // 6. Construction sécurisée des données
  const totalValue = Object.values(categoryData).reduce((a, b) => a + b, 0);
  
  // Données catégories
  const chartData = Object.entries(categoryData).length > 0 
    ? Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, valeur]) => ({ label, valeur }))
    : [{ label: "Aucune donnée", valeur: 1 }];

  // Top consommation
  const topConsumption = Object.entries(productConsumption).length > 0
    ? Object.entries(productConsumption)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, valeur]) => ({ label, valeur }))
    : [{ label: "Aucune consommation", valeur: 0 }];

  // Valeur par site
  const siteValueDataProcessed = Object.entries(siteValueData).length > 0
    ? Object.entries(siteValueData)
        .sort((a, b) => b[1] - a[1])
        .map(([label, valeur]) => ({ label, valeur }))
    : sites.map(s => ({ label: s.name, valeur: 0 }));

  // Dépenses par site
  const siteExpenseData = Object.entries(siteExpenses).length > 0
    ? Object.entries(siteExpenses)
        .sort((a, b) => b[1] - a[1])
        .map(([label, valeur]) => ({ label, valeur }))
    : sites.map(s => ({ label: s.name, valeur: 0 }));

  // Dépenses mensuelles
  const monthlyExpenseData = Object.entries(monthlyExpenses).length > 0
    ? Object.entries(monthlyExpenses)
        .sort((a, b) => {
          // Tri chronologique
          const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
          const aVal = a[0].toLowerCase();
          const bVal = b[0].toLowerCase();
          const aIndex = months.findIndex(m => aVal.includes(m));
          const bIndex = months.findIndex(m => bVal.includes(m));
          return aIndex - bIndex;
        })
        .map(([label, valeur]) => ({ label, valeur }))
    : defaultMonthData;

  // Alertes critiques
  const criticalAlerts = products
    .filter(p => p.currentStock <= p.minStock)
    .map(p => `${p.name} : ${p.currentStock}/${p.minStock} ${p.unit}`);
  
  if (criticalAlerts.length === 0 && products.length > 0) {
    criticalAlerts.push("✅ Aucun seuil critique détecté");
  } else if (products.length === 0) {
    criticalAlerts.push("📦 Aucun produit enregistré");
  }

  // Recommandations
  const recommendations: string[] = [];
  
  const redSites = healthIndicators.filter(h => h.status === 'red').length;
  const orangeSites = healthIndicators.filter(h => h.status === 'orange').length;
  
  if (redSites > 0) {
    recommendations.push(`🔴 URGENT : ${redSites} site(s) en état critique nécessitent un audit immédiat`);
  }
  
  if (orangeSites > 0) {
    recommendations.push(`🟠 ATTENTION : ${orangeSites} site(s) présentent des anomalies à surveiller`);
  }
  
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;
  if (outOfStockCount > 0) {
    recommendations.push(`⚠️ RUPTURE : ${outOfStockCount} article(s) en stock zéro à réapprovisionner en priorité`);
  }
  
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  if (lowStockCount > 0) {
    recommendations.push(`📉 SEUIL : ${lowStockCount} article(s) sous le minimum - Commander sous 48h`);
  }
  
  if (!isPositive && totalOut > 0) {
    recommendations.push(`💰 TRÉSORERIE : Sorties ${balanceRatio}% supérieures aux entrées - Réduire les consommations ou augmenter les appros`);
  }
  
  if (recommendations.length === 0 && products.length > 0) {
    recommendations.push(`✅ SITUATION OPTIMALE : Tous les indicateurs sont au vert`);
    recommendations.push(`📅 Prochain audit trimestriel programmé`);
    recommendations.push(`🔄 Maintenir la cadence actuelle de réapprovisionnement`);
  }

  return {
    summary: totalValue > 0 
      ? `Valorisation globale : ${totalValue.toLocaleString()} Fc. Réseau de ${sites.length} sites analysé.`
      : `📊 Aucun stock enregistré. Configurez votre premier site et ajoutez des produits.`,
    
    criticalAlerts: criticalAlerts.slice(0, 8), // Limiter à 8 alertes
    
    recommendations: recommendations.slice(0, 5), // Limiter à 5 recommandations
    
    financialProjection: totalValue > 0
      ? `Budget estimé : ${(totalValue * 0.15).toLocaleString()} Fc (15% de la valeur stock)`
      : "Ajoutez des produits pour générer des projections financières.",
    
    chartData,
    topConsumption,
    siteValueData: siteValueDataProcessed,
    siteExpenseData,
    monthlyExpenseData,
    healthIndicators,
    
    balanceAnalysis: {
      isPositive,
      ratio: balanceRatio,
      message: totalIn === 0 && totalOut === 0
        ? "Aucune activité financière sur 30j"
        : isPositive 
          ? `Sain : Entrées ${balanceRatio}% des sorties` 
          : `Alerte : Sorties ${balanceRatio}% des entrées`
    },
    
    generatedAt: now.toISOString()
  };
};