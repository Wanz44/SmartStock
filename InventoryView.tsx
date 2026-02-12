import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Download, Upload, Edit3, Minus, Printer, Activity, MapPin, Trash2,
  FileDown, FileUp, FileText, Database, X, ChevronDown, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import { Product, AppSettings, Site } from './types';
import { Badge } from './Badge';
import { INITIAL_CATEGORIES } from './constants';

interface InventoryViewProps {
  products: Product[];
  settings: AppSettings;
  sites: Site[];
  onMovement: (p: Product, type: 'entry' | 'exit') => void;
  onEdit: (p: Product) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onExport?: () => void;
  onExportCSV?: () => void; // Option supplémentaire pour export direct
}

export const InventoryView = ({ 
  products, 
  settings, 
  sites, 
  onMovement, 
  onEdit, 
  onImport, 
  onAdd, 
  onDelete,
  onExport,
  onExportCSV 
}: InventoryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSite, setFilterSite] = useState('All');
  
  // État pour le menu déroulant "Ajouter"
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  
  // Référence pour le bouton d'export (pour notifier)
  const exportNotified = useRef(false);

  const exchangeRate = settings.exchangeRate;

  // ============================================
  // FONCTION D'EXPORTATION CSV AMÉLIORÉE
  // ============================================
  const handleExportCSV = () => {
    // Vérifier s'il y a des produits à exporter
    if (products.length === 0) {
      alert("❌ Aucun produit à exporter. L'inventaire est vide.");
      return;
    }

    try {
      // 1. Définir les en-têtes du CSV
      const headers = [
        "Code", 
        "Désignation", 
        "Catégorie", 
        "Site", 
        "Stock Actuel", 
        "Stock Minimum", 
        "Unité", 
        "Prix Unitaire", 
        "Devise", 
        "Valeur (Fc)"
      ];

      // 2. Construire les lignes de données
      const rows = products.map(p => {
        const siteName = getSiteName(p.siteId);
        const valFc = p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice);
        
        return [
          p.id,
          p.name,
          p.category,
          siteName,
          p.currentStock.toString(),
          p.minStock.toString(),
          p.unit,
          p.unitPrice.toString(),
          p.currency,
          valFc.toString()
        ];
      });

      // 3. Créer le contenu CSV avec gestion des guillemets
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => {
          // Échapper les guillemets et encapsuler
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(","))
        .join("\n");

      // 4. Ajouter BOM pour UTF-8 (compatible Excel)
      const blob = new Blob(["\uFEFF" + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });

      // 5. Créer et déclencher le téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      // Nom de fichier avec date
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute("download", `inventaire_complet_${dateStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 6. Notification de succès
      alert(`✅ Export réussi : ${products.length} produit(s) exporté(s)`);
      
    } catch (error) {
      console.error("Erreur d'export CSV:", error);
      alert("❌ Erreur lors de l'export. Veuillez réessayer.");
    }

    // Fermer le menu
    setIsAddMenuOpen(false);
  };

  // ============================================
  // GESTIONNAIRES DE CLIC
  // ============================================
  
  // Gestionnaire pour l'ajout manuel
  const handleManualAdd = () => {
    onAdd();
    setIsAddMenuOpen(false);
  };

  // Gestionnaire pour l'import
  const handleImportClick = () => {
    if (importFileInputRef.current) {
      importFileInputRef.current.click();
    }
    setIsAddMenuOpen(false);
  };

  // Gestionnaire principal d'export (utilise la prop ou la fonction interne)
  const handleExport = () => {
    // Priorité à la prop onExportCSV si fournie
    if (onExportCSV) {
      onExportCSV();
      setIsAddMenuOpen(false);
      return;
    }
    
    // Sinon priorité à onExport
    if (onExport) {
      onExport();
      setIsAddMenuOpen(false);
      return;
    }
    
    // Sinon utilise la fonction interne
    handleExportCSV();
  };

  // ============================================
  // FERMETURE DU MENU AU CLIC EXTÉRIEUR
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  const getSiteName = (siteId: string) => {
    return sites.find(s => s.id === siteId)?.name || 'Site inconnu';
  };

  // ============================================
  // FILTRAGE DES PRODUITS
  // ============================================
  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      const matchesSite = filterSite === 'All' || p.siteId === filterSite;
      const isLow = p.currentStock <= p.minStock;
      const matchesStatus = filterStatus === 'All' || 
                           (filterStatus === 'Critique' && p.currentStock <= 0) ||
                           (filterStatus === 'Réappro' && isLow && p.currentStock > 0) ||
                           (filterStatus === 'Optimal' && !isLow);
      return matchesSearch && matchesCategory && matchesStatus && matchesSite;
    });
  }, [products, searchTerm, filterCategory, filterStatus, filterSite]);

  // ============================================
  // STATISTIQUES RAPIDES
  // ============================================
  const stats = useMemo(() => {
    return {
      total: products.length,
      totalStock: products.reduce((acc, p) => acc + p.currentStock, 0),
      critical: products.filter(p => p.currentStock <= p.minStock).length,
      outOfStock: products.filter(p => p.currentStock === 0).length,
      totalValue: products.reduce((acc, p) => {
        const val = p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice);
        return acc + val;
      }, 0)
    };
  }, [products, exchangeRate]);

  // ============================================
  // IMPRESSION
  // ============================================
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-32">
      
      {/* ======================================== */}
      {/* EN-TÊTE D'IMPRESSION (Caché à l'écran) */}
      {/* ======================================== */}
      <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Activity className="w-12 h-12 text-[#1a3a22]" />
            <div>
              <h1 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
                {settings.enterpriseName}
              </h1>
              <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">
                Localisation : {settings.locationId}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-header italic text-[#1a3a22]">Rapport d'Inventaire Officiel</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
              Généré le : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* BARRE DE STATISTIQUES RAPIDES */}
      {/* ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black uppercase text-slate-400">Total Produits</p>
          <p className="text-2xl font-black italic text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black uppercase text-slate-400">Valeur Stock</p>
          <p className="text-2xl font-black italic text-emerald-600">{(stats.totalValue / 1000000).toFixed(1)}M Fc</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black uppercase text-amber-500">Seuil Critique</p>
          <p className="text-2xl font-black italic text-amber-600">{stats.critical}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black uppercase text-rose-500">Rupture</p>
          <p className="text-2xl font-black italic text-rose-600">{stats.outOfStock}</p>
        </div>
      </div>

      {/* ======================================== */}
      {/* BARRE D'OUTILS PRINCIPALE */}
      {/* ======================================== */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 no-print">
        
        {/* SECTION RECHERCHE & FILTRES */}
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          
          {/* Champ de recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Rechercher un article par nom ou code..." 
              className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3 rounded-xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtre Site */}
          <select 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
          >
            <option value="All">🏢 Tous les Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
            ))}
          </select>
          
          {/* Filtre Catégorie */}
          <select 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">📁 Toutes Catégories</option>
            {INITIAL_CATEGORIES.map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
          
          {/* Filtre Statut (caché mais fonctionnel) */}
          <select 
            className="hidden"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Tous</option>
            <option value="Critique">Critique</option>
            <option value="Réappro">Réappro</option>
            <option value="Optimal">Optimal</option>
          </select>
        </div>
        
        {/* SECTION BOUTONS D'ACTION */}
        <div className="flex items-center gap-3">
          
          {/* ======================================== */}
          {/* BOUTON AJOUTER AVEC MENU DÉROULANT */}
          {/* ======================================== */}
          <div className="relative" ref={addMenuRef}>
            <button 
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg"
              aria-expanded={isAddMenuOpen}
              aria-haspopup="true"
            >
              <Plus className="w-3.5 h-3.5" /> 
              Ajouter 
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* MENU DÉROULANT - AMÉLIORÉ */}
            {isAddMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] animate-fade-in">
                
                {/* Option 1 : Ajout manuel */}
                <button 
                  onClick={handleManualAdd}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-slate-50 transition-all text-left group border-b border-slate-50"
                >
                  <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase text-slate-900 group-hover:text-emerald-700">
                      ➕ Ajout manuel
                    </p>
                    <p className="text-[8px] font-bold text-slate-400">
                      Créer un produit individuellement
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg] group-hover:text-emerald-600" />
                </button>
                
                {/* Option 2 : Importer CSV/Excel */}
                <button 
                  onClick={handleImportClick}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-slate-50 transition-all text-left group border-b border-slate-50"
                >
                  <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                    <Upload className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase text-slate-900 group-hover:text-indigo-700">
                      📤 Importer CSV/Excel
                    </p>
                    <p className="text-[8px] font-bold text-slate-400">
                      Import en masse (CSV, XLSX)
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-300 rotate-[-90deg] group-hover:text-indigo-600" />
                </button>
                
                {/* Option 3 : Exporter CSV */}
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <Download className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase text-slate-900 group-hover:text-emerald-700">
                      📥 Exporter CSV
                    </p>
                    <p className="text-[8px] font-bold text-slate-400">
                      Export du catalogue complet
                    </p>
                  </div>
                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                    {products.length}
                  </span>
                </button>
                
                {/* Indicateur de nombre de produits */}
                <div className="mt-2 pt-2 border-t border-slate-50 px-4 py-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase flex justify-between">
                    <span>📦 Total inventaire</span>
                    <span className="text-slate-900">{products.length} produit(s)</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* INPUT FILE CACHÉ POUR L'IMPORT */}
          <input 
            ref={importFileInputRef}
            type="file" 
            accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={onImport} 
            className="hidden" 
            id="import-file-input"
          />
          
          {/* BOUTON IMPRIMER */}
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-[#1a3a22] hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> 
            Imprimer
          </button>
        </div>
      </div>

      {/* ======================================== */}
      {/* TABLEAU D'INVENTAIRE */}
      {/* ======================================== */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-slate-200">
        
        {/* En-tête du tableau */}
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 print:bg-slate-100">
            <tr>
              <th className="px-8 py-6 w-16 text-center">#</th>
              <th className="px-10 py-6">Référence & Désignation</th>
              <th className="px-10 py-6">Site</th>
              <th className="px-10 py-6">Catégorie</th>
              <th className="px-10 py-6 text-center">Stock Actuel</th>
              <th className="px-10 py-6 text-center">Statut</th>
              <th className="px-10 py-6 text-right">P.U.</th>
              <th className="px-10 py-6 text-right">Valorisation</th>
              <th className="px-10 py-6 text-center no-print">Actions</th>
            </tr>
          </thead>
          
          {/* Corps du tableau */}
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-10 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Database className="w-12 h-12 text-slate-300" />
                    <p className="text-[12px] font-black uppercase italic text-slate-400">
                      Aucun article trouvé
                    </p>
                    <p className="text-[9px] font-bold text-slate-300">
                      Utilisez le bouton "Ajouter" pour créer votre premier produit
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p: Product, idx: number) => {
                const valFc = p.currentStock * (p.currency === '$' ? p.unitPrice * exchangeRate : p.unitPrice);
                const isLow = p.currentStock <= p.minStock;
                const isOutOfStock = p.currentStock === 0;
                
                return (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 text-center text-[10px] font-black text-slate-300">
                      {idx + 1}
                    </td>
                    
                    <td className="px-10 py-6">
                      <p className="text-[8px] font-black text-slate-300 uppercase">
                        {p.id}
                      </p>
                      <p className="text-[12px] font-black uppercase italic text-slate-900">
                        {p.name}
                      </p>
                    </td>
                    
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span className="text-[9px] font-black uppercase text-slate-500 italic">
                          {getSiteName(p.siteId)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-10 py-6">
                      <span className="text-[9px] font-black uppercase text-slate-400 border border-slate-100 px-2 py-1 rounded-lg">
                        {p.category}
                      </span>
                    </td>
                    
                    <td className="px-10 py-6 text-center">
                      <span className={`text-xl font-black italic ${
                        isOutOfStock ? 'text-rose-500' : 
                        isLow ? 'text-amber-500' : 'text-slate-900'
                      }`}>
                        {p.currentStock}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 ml-2">
                        / {p.minStock}
                      </span>
                    </td>
                    
                    <td className="px-10 py-6 text-center">
                      {isOutOfStock ? (
                        <Badge variant="danger">RUPTURE</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">RÉAPPRO</Badge>
                      ) : (
                        <Badge variant="success">OPTIMAL</Badge>
                      )}
                    </td>
                    
                    <td className="px-10 py-6 text-right font-bold text-slate-600 italic">
                      {p.unitPrice.toLocaleString()} {p.currency}
                    </td>
                    
                    <td className="px-10 py-6 text-right font-black italic text-slate-900">
                      {valFc.toLocaleString()} Fc
                    </td>
                    
                    <td className="px-10 py-6 text-center no-print">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(p)} 
                          title="Modifier" 
                          className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onMovement(p, 'entry')} 
                          title="Entrée" 
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onMovement(p, 'exit')} 
                          title="Sortie" 
                          className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDelete(p.id)} 
                          title="Supprimer" 
                          className="p-2 bg-slate-50 text-slate-300 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================== */}
      {/* LÉGENDE DES STATUTS */}
      {/* ======================================== */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-6 text-[8px] font-black uppercase text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>Réapprovisionner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span>Rupture / Critique</span>
          </div>
        </div>
        
        <div className="text-[8px] font-black text-slate-300">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
      
      {/* ======================================== */}
      {/* MESSAGE SI AUCUN SITE */}
      {/* ======================================== */}
      {sites.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 no-print">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-[9px] font-black uppercase text-amber-700">
            ⚠️ Aucun site configuré. Créez d'abord un site dans "Gestion Sites" avant d'ajouter des produits.
          </p>
        </div>
      )}
    </div>
  );
};