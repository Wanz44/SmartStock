
import { Product, InventoryLog, RapportAutomatique, Site } from "../types";

export const getAutomatedReport = async (products: Product[], history: InventoryLog[], exchangeRate: number, sites: Site[]): Promise<RapportAutomatique> => {
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
    const siteName = sites.find(s => s.id === p.siteId)?.name || 'Inconnu';
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
      const siteName = sites.find(s => s.id === h.siteId)?.name || 'Inconnu';
      siteExpenses[siteName] = (siteExpenses[siteName] || 0) + expenseValue;

      // Par produit (Volume)
      productConsumption[h.productName] = (productConsumption[h.productName] || 0) + volume;
    }
  });

  // 3. Indicateurs de santé par site
  const healthIndicators = sites.map(site => {
    const siteProds = products.filter(p => p.siteId === site.id);
    if (siteProds.length === 0) return { siteName: site.name, status: 'green' as const, score: 100 };
    
    const criticals = siteProds.filter(p => p.currentStock <= p.minStock).length;
    const healthScore = Math.max(0, 100 - (criticals / siteProds.length) * 100);
    
    return {
      siteName: site.name,
      status: healthScore > 80 ? 'green' as const : healthScore > 50 ? 'orange' as const : 'red' as const,
      score: Math.round(healthScore)
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
  const balanceRatio = totalOut === 0 ? 100 : (totalIn / totalOut) * 100;

  // Finalisation du rapport
  const totalValue = Object.values(categoryData).reduce((a, b) => a + b, 0);

  return {
    summary: `Valorisation globale : ${totalValue.toLocaleString()} Fc. Réseau de ${sites.length} sites analysé.`,
    criticalAlerts: products.filter(p => p.currentStock <= p.minStock).map(p => `${p.name} : Critique`),
    recommendations: [
      `${healthIndicators.filter(h => h.status === 'red').length} sites nécessitent une attention urgente.`,
      `Budget réappro estimé : ${(totalValue * 0.15).toLocaleString()} Fc.`,
      isPositive ? "Le bilan flux est positif : les entrées couvrent les consommations." : "Bilan flux négatif : déstockage net observé ce mois."
    ],
    financialProjection: `Flux mensuel moyen : ${(Object.values(monthlyExpenses).reduce((a, b) => a + b, 0) / 3 || 0).toLocaleString()} Fc.`,
    chartData: Object.entries(categoryData).map(([label, valeur]) => ({ label, valeur })),
    topConsumption: Object.entries(productConsumption).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, valeur]) => ({ label, valeur })),
    siteValueData: Object.entries(siteValueData).map(([label, valeur]) => ({ label, valeur })),
    siteExpenseData: Object.entries(siteExpenses).map(([label, valeur]) => ({ label, valeur })),
    monthlyExpenseData: Object.entries(monthlyExpenses).map(([label, valeur]) => ({ label, valeur })),
    healthIndicators,
    balanceAnalysis: {
      isPositive,
      ratio: Math.round(balanceRatio),
      message: isPositive ? "Sain : Entrées > Sorties" : "Alerte : Sorties > Entrées"
    },
    generatedAt: now.toISOString()
  };
};
