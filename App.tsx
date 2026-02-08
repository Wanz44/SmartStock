
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Package, History as HistoryIcon, Plus, AlertTriangle, 
  Trash2, Search, X, DollarSign, Settings as SettingsIcon, Edit2, 
  Sparkles, Loader2, ShieldAlert, ShieldCheck, 
  Armchair, FileText, Camera, Upload, 
  Image as ImageIcon, ChevronRight, Globe,
  Box, Printer, User, ArrowRightLeft, 
  BarChart3, Shield, Cpu, Database, Save, RefreshCw, Lock,
  Activity, FileSpreadsheet, ChevronDown, FileDown, Wand2, Zap, MapPin,
  Building2, HardDrive, SearchCode, ScanFace, DatabaseZap, Filter, TrendingDown,
  ChevronUp, ChevronDown as ChevronDownIcon, Layers, MoreHorizontal,
  PlusCircle, Check, LogOut, Info, FileUp, FileSpreadsheet as ExcelIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Product, InventoryLog, ViewType, Site, Furniture, RapportAutomatique } from './types';
import { INITIAL_PRODUCTS, INITIAL_FURNITURE, INITIAL_CATEGORIES } from './constants';
import { getProfessionalReport, extractDataFromFile, generateProductImage } from './services/geminiService';

const getStored = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try { return JSON.parse(saved); } catch (e) { return defaultValue; }
};

declare const window: any;

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  
  const [products, setProducts] = useState<Product[]>(() => getStored('ss_products', INITIAL_PRODUCTS));
  const [furniture, setFurniture] = useState<Furniture[]>(() => getStored('ss_furniture', INITIAL_FURNITURE));
  const [history, setHistory] = useState<InventoryLog[]>(() => getStored('ss_history', []));
  const [sites] = useState<Site[]>([
    { id: 'S1', name: 'ENTREPÔT CENTRAL (KINSHASA)', location: 'Limete', capacity: 15000, status: 'Opérationnel', manager: 'Admin Pro' },
    { id: 'S2', name: 'SIÈGE SOCIAL (GOMBE)', location: 'Gombe', capacity: 5000, status: 'Opérationnel', manager: 'Admin Pro' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiReport, setAiReport] = useState<RapportAutomatique | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [importData, setImportData] = useState<Partial<Product>[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // État pour la confirmation d'action
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });

  // États pour la modification de produit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadingMessages = [
    "Initialisation du moteur Vision Pro...",
    "Analyse de la structure sémantique du document...",
    "Classification intelligente par type d'article...",
    "Certification des flux par SmartStock AI...",
    "Préparation du registre de vérification..."
  ];

  useEffect(() => {
    localStorage.setItem('ss_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ss_furniture', JSON.stringify(furniture));
  }, [furniture]);

  useEffect(() => {
    localStorage.setItem('ss_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval: any;
    if (isAiLoading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) setHasApiKey(true);
    };
    checkKey();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addHistoryLog = (type: InventoryLog['type'], productId: string, productName: string, change: number, final: number, reason?: string) => {
    const newLog: InventoryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type,
      productId,
      productName,
      changeAmount: change,
      finalStock: final,
      reason,
      responsible: 'Admin Pro'
    };
    setHistory(prev => [...prev, newLog]);
  };

  const handleDeleteProduct = (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: "Suppression du registre",
      message: `Voulez-vous vraiment retirer l'article "${productToDelete.name}" de l'inventaire SmartStock ? Cette action est irréversible.`,
      type: 'danger',
      onConfirm: () => {
        setProducts(prev => prev.filter(p => p.id !== id));
        addHistoryLog('adjustment', id, productToDelete.name, -productToDelete.currentStock, 0, "Suppression définitive du registre");
        showToast("Article supprimé du registre");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleOpenEditModal = (product: Product | null) => {
    if (product) {
      setEditingProduct({ ...product });
    } else {
      setEditingProduct({
        id: `prod-${Date.now()}`,
        name: '',
        category: INITIAL_CATEGORIES[0],
        currentStock: 0,
        minStock: 10,
        monthlyNeed: 0,
        unit: 'unités',
        unitPrice: 0,
        currency: 'Fc',
        siteId: 'S1',
        lastInventoryDate: new Date().toISOString()
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      showToast("Le nom de l'article est obligatoire", "error");
      return;
    }

    const saveAction = () => {
      setProducts(prev => {
        const exists = prev.find(p => p.id === editingProduct.id);
        if (exists) {
          const change = editingProduct.currentStock - exists.currentStock;
          if (change !== 0) {
            addHistoryLog('adjustment', editingProduct.id, editingProduct.name, change, editingProduct.currentStock, "Mise à jour manuelle des stocks");
          }
          return prev.map(p => p.id === editingProduct.id ? editingProduct : p);
        } else {
          addHistoryLog('entry', editingProduct.id, editingProduct.name, editingProduct.currentStock, editingProduct.currentStock, "Création manuelle d'article");
          return [...prev, editingProduct];
        }
      });
      setIsEditModalOpen(false);
      setEditingProduct(null);
      showToast("Registre SmartStock mis à jour");
    };

    const exists = products.find(p => p.id === editingProduct.id);
    if (exists) {
      setConfirmModal({
        isOpen: true,
        title: "Confirmer les modifications",
        message: `Souhaitez-vous enregistrer les changements apportés à l'article "${editingProduct.name}" ?`,
        type: 'info',
        onConfirm: () => {
          saveAction();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      saveAction();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1];
      try {
        const data = await extractDataFromFile(base64Data, file.type);
        setImportData(data);
        setIsReviewOpen(true);
      } catch (error) {
        showToast("Échec de l'analyse intelligente", "error");
      } finally {
        setIsAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/);
      
      const parsedData: Partial<Product>[] = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(/[;,]/);
        return {
          name: values[0]?.trim() || "Article sans nom",
          category: values[1]?.trim() || "Autre",
          currentStock: parseInt(values[2]) || 0,
          unitPrice: parseInt(values[3]) || 0,
          unit: values[4]?.trim() || "unités"
        };
      });

      if (parsedData.length > 0) {
        setConfirmModal({
          isOpen: true,
          title: "Importation CSV détectée",
          message: `Voulez-vous importer manuellement ${parsedData.length} articles dans le registre ? (Format attendu: Nom, Catégorie, Stock, Prix, Unité)`,
          type: 'info',
          onConfirm: () => {
            const newProducts: Product[] = parsedData.map((item, idx) => ({
              id: `csv-${Date.now()}-${idx}`,
              name: item.name!,
              category: INITIAL_CATEGORIES.includes(item.category!) ? item.category! : "Autre",
              currentStock: item.currentStock || 0,
              minStock: 10,
              monthlyNeed: 0,
              unit: item.unit || "unités",
              unitPrice: item.unitPrice || 0,
              currency: 'Fc',
              siteId: 'S1',
              lastInventoryDate: new Date().toISOString()
            }));

            setProducts(prev => [...prev, ...newProducts]);
            newProducts.forEach(p => {
              addHistoryLog('entry', p.id, p.name, p.currentStock, p.currentStock, "Import manuel via fichier CSV");
            });
            showToast(`${newProducts.length} articles importés avec succès`);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        showToast("Le fichier CSV semble vide ou mal formé", "error");
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // NEW: Filtered Export with Green Formatting (Excel compatible HTML)
  const handleFilteredExport = () => {
    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Toutes' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
      showToast("Aucune donnée correspondant aux filtres", "error");
      return;
    }

    const title = `Inventaire SmartStock - ${selectedCategory} - ${new Date().toLocaleDateString()}`;
    const headerColor = "#143d21";
    const subColor = "#f0fdf4";
    const textColor = "#ffffff";

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', sans-serif; }
          th { background-color: ${headerColor}; color: ${textColor}; padding: 12px; border: 1px solid #ddd; text-align: left; text-transform: uppercase; font-size: 10px; }
          td { padding: 10px; border: 1px solid #ddd; font-size: 11px; }
          .row-even { background-color: ${subColor}; }
          .title { font-size: 20px; font-weight: bold; color: ${headerColor}; margin-bottom: 20px; text-align: center; }
          .footer { font-size: 9px; color: #999; margin-top: 20px; text-align: right; }
          .alert { color: #e11d48; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="title">${title}</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Stock</th>
              <th>Seuil</th>
              <th>Prix Unitaire</th>
              <th>Valeur Totale</th>
              <th>Unité</th>
              <th>Site</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    filtered.forEach((p, index) => {
      const isLow = p.currentStock <= p.minStock;
      const totalVal = p.currentStock * p.unitPrice;
      html += `
        <tr class="${index % 2 === 0 ? '' : 'row-even'}">
          <td>SKU-${p.id.slice(-4)}</td>
          <td><b>${p.name.toUpperCase()}</b></td>
          <td>${p.category}</td>
          <td style="text-align: center; font-weight: bold;">${p.currentStock}</td>
          <td style="text-align: center;">${p.minStock}</td>
          <td>${p.unitPrice.toLocaleString()} ${p.currency}</td>
          <td><b>${totalVal.toLocaleString()} ${p.currency}</b></td>
          <td>${p.unit}</td>
          <td>${p.siteId}</td>
          <td class="${isLow ? 'alert' : ''}">${isLow ? 'RÉAPPRO' : 'OPTIMAL'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <div class="footer">Généré par SmartStock Pro Automatic System - DRC HQ - ${new Date().toLocaleString()}</div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SmartStock_Export_Vert_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Export filtré (Tableau Vert) généré");
  };

  const handleManualCsvExport = () => {
    if (products.length === 0) {
      showToast("Aucune donnée à exporter", "error");
      return;
    }

    const headers = ["Désignation", "Catégorie", "Stock Actuel", "Prix Unitaire", "Unité", "Site", "Dernier Inventaire"];
    const rows = products.map(p => [
      p.name,
      p.category,
      p.currentStock.toString(),
      p.unitPrice.toString(),
      p.unit,
      p.siteId,
      new Date(p.lastInventoryDate).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SmartStock_Inventaire_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Registre exporté au format CSV");
  };

  const handleAiReport = async () => {
    setIsAiLoading(true);
    try {
      const report = await getProfessionalReport(products, history);
      setAiReport(report);
      showToast("Audit certifié généré");
    } catch (error) {
      showToast("Erreur d'audit", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const confirmImport = () => {
    const newProducts: Product[] = importData.map((item, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      name: item.name || 'Produit Inconnu',
      category: item.category || 'Autre',
      currentStock: item.currentStock || 0,
      minStock: 10,
      monthlyNeed: 0,
      unit: item.unit || 'unités',
      unitPrice: item.unitPrice || 0,
      currency: 'Fc',
      siteId: 'S1',
      lastInventoryDate: new Date().toISOString(),
    }));

    setProducts(prev => [...prev, ...newProducts]);
    newProducts.forEach(p => {
      addHistoryLog('entry', p.id, p.name, p.currentStock, p.currentStock, "Import automatique via Vision AI");
    });
    
    setIsReviewOpen(false);
    setImportData([]);
    showToast(`${newProducts.length} articles classés et sauvegardés`);
  };

  const ConfirmationModal = () => {
    if (!confirmModal.isOpen) return null;

    const colors = {
      danger: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-100',
        btn: 'bg-rose-600 hover:bg-rose-700',
        icon: <AlertTriangle className="w-8 h-8" />
      },
      info: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-100',
        btn: 'bg-[#143d21] hover:bg-black',
        icon: <Info className="w-8 h-8" />
      },
      success: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        btn: 'bg-emerald-600 hover:bg-emerald-700',
        icon: <ShieldCheck className="w-8 h-8" />
      }
    }[confirmModal.type];

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border flex flex-col items-center text-center space-y-6 animate-modal">
          <div className={`p-6 rounded-3xl ${colors.bg} ${colors.text} ${colors.border} border-2`}>
            {colors.icon}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{confirmModal.title}</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed px-4">{confirmModal.message}</p>
          </div>
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
              className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={confirmModal.onConfirm} 
              className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all ${colors.btn}`}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ExtractionLoader = () => (
    <div className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-white w-full max-xl rounded-[4rem] p-16 shadow-2xl text-center space-y-12 border animate-in zoom-in-95 duration-500">
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-emerald-100 rounded-[2.5rem] animate-pulse" />
          <div className="absolute inset-4 bg-white rounded-[2rem] flex items-center justify-center shadow-inner">
            <ScanFace className="w-12 h-12 text-[#143d21] animate-bounce" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#143d21] rounded-2xl flex items-center justify-center text-white shadow-xl animate-spin-slow">
            <DatabaseZap className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Extraction Automatique Pro</h3>
          <div className="h-6 overflow-hidden">
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] animate-in slide-in-from-bottom-2">
              {loadingMessages[loadingStep]}
            </p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#143d21] to-emerald-500 transition-all duration-700 ease-out" style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }} />
        </div>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-relaxed">Traitement temps réel via SmartStock Vision Engine v4.0</p>
      </div>
    </div>
  );

  const DashboardView = () => {
    const totalValue = products.reduce((a,b)=>a+(b.currentStock*b.unitPrice), 0);
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="VALEUR CONSOMMABLES" value={`${totalValue.toLocaleString()} Fc`} icon={DollarSign} trend="RÉEL" />
          <StatCard label="PATRIMOINE IMMOBILISÉ" value="0 Fc" icon={Building2} trend="VIDE" />
          <StatCard label="RUPTURES DE STOCK" value={products.filter(p=>p.currentStock<=p.minStock).length} icon={ShieldAlert} alert={products.filter(p=>p.currentStock<=p.minStock).length > 0} />
          <StatCard label="ACTIFS GÉRÉS" value={furniture.length + products.length} icon={Armchair} trend={`${products.length}`} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-8 border rounded-[2rem] shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Activity className="w-4 h-4 text-[#143d21]" /> Journal de traçabilité récent</h3>
              <button onClick={() => setActiveView('history')} className="text-[9px] font-black uppercase text-[#143d21] border-b border-[#143d21]/20">Registre Complet</button>
            </div>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.slice(-5).reverse().map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${log.type === 'entry' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {log.type === 'entry' ? <ChevronUp className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-900">{log.productName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black italic ${log.changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.changeAmount >= 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">En attente de flux logistiques...</p>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 border rounded-[2rem] shadow-sm space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Flux de travail rapide</h4>
              <WorkflowAction icon={FileText} label="Lancer l'audit automatique" onClick={() => setActiveView('monthly_report')} />
              <WorkflowAction icon={Camera} label="Extraction Vision" onClick={() => setActiveView('import')} />
              <WorkflowAction icon={Armchair} label="Recensement Mobilier" onClick={() => setActiveView('furniture')} />
              <WorkflowAction icon={ImageIcon} label="Visualisation Studio" onClick={() => setActiveView('studio')} />
            </div>
            <div className="bg-[#143d21] p-8 rounded-[2rem] text-white space-y-4 shadow-xl relative overflow-hidden">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h4 className="text-sm font-black uppercase italic tracking-tighter">Système prêt à l'emploi</h4>
              <p className="text-[9px] font-medium text-emerald-100/40 uppercase tracking-widest leading-relaxed">Vos données sont sauvegardées localement dans votre navigateur.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InventoryView = () => {
    const filteredProducts = useMemo(() => {
      return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Toutes' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    }, [products, searchTerm, selectedCategory]);

    const stats = {
      totalItems: products.length,
      lowStock: products.filter(p => p.currentStock <= p.minStock).length,
      outOfStock: products.filter(p => p.currentStock === 0).length,
      totalValue: products.reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0)
    };

    const categories = ['Toutes', ...INITIAL_CATEGORIES];

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv,.txt"
          onChange={handleManualCsvImport} 
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><Layers className="w-5 h-5" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Articles</p>
              <p className="text-xl font-black italic text-slate-900 leading-none mt-1">{stats.totalItems}</p>
            </div>
          </div>
          <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex items-center gap-4 border-rose-100">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><TrendingDown className="w-5 h-5" /></div>
            <div>
              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Alerte Stock</p>
              <p className="text-xl font-black italic text-rose-600 leading-none mt-1">{stats.lowStock}</p>
            </div>
          </div>
          <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Valeur Stockée</p>
              <p className="text-xl font-black italic text-emerald-700 leading-none mt-1">{stats.totalValue.toLocaleString()} Fc</p>
            </div>
          </div>
          <div className="bg-white p-6 border rounded-[2rem] shadow-sm flex items-center gap-4 border-amber-100">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><ShieldAlert className="w-5 h-5" /></div>
            <div>
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Rupture (0)</p>
              <p className="text-xl font-black italic text-amber-600 leading-none mt-1">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border rounded-3xl shadow-sm flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher par désignation, référence ou site..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-medium text-xs text-slate-900 focus:bg-white transition-all border-2 border-transparent focus:border-emerald-500/10"
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black uppercase text-[9px] tracking-widest text-slate-900 appearance-none cursor-pointer"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3 pointer-events-none" />
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-5 py-4 bg-white border-2 border-slate-50 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              title="Importer un fichier CSV"
            >
              <FileUp className="w-4 h-4 text-blue-500" /> Import
            </button>
            
            <button 
              onClick={handleFilteredExport}
              className="px-5 py-4 bg-[#f0fdf4] border-2 border-emerald-100 text-emerald-700 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
              title="Exporter le registre filtré avec mise en forme verte"
            >
              <ExcelIcon className="w-4 h-4 text-emerald-600" /> Export Vert
            </button>

            <button onClick={() => handleOpenEditModal(null)} className="px-8 py-4 bg-[#143d21] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg hover:bg-black transition-all">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-10 py-6">Référence & Désignation</th>
                  <th className="px-10 py-6">Catégorie / Site</th>
                  <th className="px-10 py-6 text-center">Niveau / Seuil</th>
                  <th className="px-10 py-6 text-center">Disponibilité</th>
                  <th className="px-10 py-6 text-right">Valorisation</th>
                  <th className="px-10 py-6 text-right">Dernière Audit</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => {
                  const isLowStock = p.currentStock <= p.minStock;
                  const isCritical = p.currentStock <= p.minStock / 2;
                  const percentage = Math.min(100, (p.currentStock / (p.minStock * 2)) * 100);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <p className="text-[8px] font-mono font-black text-slate-300 mb-0.5 uppercase tracking-tighter">SKU-{p.id.padStart(4, '0')}</p>
                        <p className="font-black text-slate-900 uppercase italic text-sm group-hover:text-[#143d21] transition-colors">{p.name}</p>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md w-max">{p.category}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">{p.siteId === 'S1' ? 'Entrepôt Central' : 'Succursale'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-black italic ${isLowStock ? 'text-rose-500' : 'text-slate-900'}`}>{p.currentStock}</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">/ {p.minStock}</span>
                          </div>
                          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${isCritical ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        {isLowStock ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase italic ${isCritical ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            <TrendingDown className="w-3 h-3" /> {isCritical ? 'Critique' : 'Réappro'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase italic">
                            <ShieldCheck className="w-3 h-3" /> Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <p className="font-black text-slate-900 italic text-sm">{(p.currentStock * p.unitPrice).toLocaleString()} {p.currency}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{p.unitPrice.toLocaleString()} / {p.unit}</p>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{new Date(p.lastInventoryDate).toLocaleDateString()}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase italic">Par: Admin_Pro</p>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {
                            const newStock = p.currentStock + 1;
                            const updated = { ...p, currentStock: newStock, lastInventoryDate: new Date().toISOString() };
                            setProducts(prev => prev.map(item => item.id === p.id ? updated : item));
                            addHistoryLog('entry', p.id, p.name, 1, newStock, "Ajout rapide (+1)");
                            showToast("+1 unité ajoutée");
                          }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><PlusCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleOpenEditModal(p)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <SearchCode className="w-12 h-12 text-slate-100 mx-auto" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Aucun article enregistré dans le système SmartStock.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const EditModal = () => {
    if (!editingProduct) return null;
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl flex flex-col animate-modal">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Gestion de l'article</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Sauvegarde immédiate dans le registre</p>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 overflow-y-auto max-h-[60vh] pr-2">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">DÉSIGNATION ARTICLE</label>
              <input 
                type="text" 
                value={editingProduct.name} 
                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">CATÉGORIE ERP</label>
              <select 
                value={editingProduct.category} 
                onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all appearance-none"
              >
                {INITIAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">STOCK ACTUEL ({editingProduct.unit})</label>
              <input 
                type="number" 
                value={editingProduct.currentStock} 
                onChange={e => setEditingProduct({ ...editingProduct, currentStock: parseInt(e.target.value) || 0 })}
                className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">SEUIL D'ALERTE (MIN)</label>
              <input 
                type="number" 
                value={editingProduct.minStock} 
                onChange={e => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 0 })}
                className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">PRIX UNITAIRE ({editingProduct.currency})</label>
              <input 
                type="number" 
                value={editingProduct.unitPrice} 
                onChange={e => setEditingProduct({ ...editingProduct, unitPrice: parseInt(e.target.value) || 0 })}
                className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">UNITÉ DE MESURE</label>
              <input 
                type="text" 
                value={editingProduct.unit} 
                onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all" 
              />
            </div>
          </div>
          <button onClick={handleSaveProduct} className="w-full py-6 bg-[#143d21] text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5" /> Confirmer & Sauvegarder
          </button>
        </div>
      </div>
    );
  };

  const FurnitureView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 border rounded-3xl shadow-sm flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Code inventaire, nom ou département d'affectation..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-medium text-xs text-slate-900 focus:bg-white transition-all border-2 border-transparent focus:border-emerald-500/10"
          />
        </div>
        <button className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg hover:bg-emerald-900 transition-all">
          <Plus className="w-4 h-4" /> Nouvel Actif
        </button>
      </div>
      <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-6">Code & Désignation</th>
              <th className="px-10 py-6">Affectation & Site</th>
              <th className="px-10 py-6 text-center">État / Condition</th>
              <th className="px-10 py-6 text-center">Quantité</th>
              <th className="px-10 py-6 text-right">Valeur Acquisition</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {furniture.map(f => (
              <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-10 py-6">
                  <p className="text-[9px] font-mono font-black text-emerald-600 tracking-tighter mb-1">{f.code}</p>
                  <p className="font-black text-slate-900 uppercase italic text-sm">{f.name}</p>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <p className="text-[10px] font-black text-slate-800 uppercase italic">Site: {f.siteId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{f.assignedTo || 'Non affecté'}</p>
                  </div>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${f.condition === 'Neuf' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{f.condition}</span>
                </td>
                <td className="px-10 py-6 text-center font-black text-slate-900 italic text-xl">
                  {f.currentCount}
                </td>
                <td className="px-10 py-6 text-right font-black text-slate-900 text-lg">{(f.purchasePrice || 0).toLocaleString()} Fc</td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-[#143d21] transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {furniture.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <Armchair className="w-12 h-12 text-slate-100 mx-auto" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Aucun actif mobilier répertorié.</p>
            </div>
          )}
      </div>
    </div>
  );

  const HistoryView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 border rounded-3xl shadow-sm flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Rechercher dans l'historique des flux..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-medium text-xs text-slate-900 focus:bg-white transition-all border-2 border-transparent focus:border-emerald-500/10"
          />
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[9px] tracking-widest border hover:bg-white transition-all">Exporter PDF</button>
          <button 
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: "Réinitialisation des logs",
                message: "Voulez-vous vider l'intégralité de l'historique des flux ? Cette opération est définitive.",
                type: 'danger',
                onConfirm: () => {
                  setHistory([]);
                  showToast("Historique réinitialisé");
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              });
            }} 
            className="px-6 py-4 bg-slate-50 text-rose-500 rounded-2xl font-black uppercase text-[9px] tracking-widest border hover:bg-rose-50 transition-all"
          >
            Vider les logs
          </button>
        </div>
      </div>
      <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-6">Date & ID</th>
              <th className="px-10 py-6">Opération / Article</th>
              <th className="px-10 py-6 text-center">Type de flux</th>
              <th className="px-10 py-6 text-center">Variation</th>
              <th className="px-10 py-6 text-right">Stock Final</th>
              <th className="px-10 py-6 text-right">Opérateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.length > 0 ? [...history].reverse().map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-6">
                  <p className="text-[8px] font-mono font-black text-emerald-600/40 mb-1">LOG-{log.id.slice(0,8)}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(log.date).toLocaleString()}</p>
                </td>
                <td className="px-10 py-6">
                  <p className="font-black text-slate-900 uppercase italic text-sm">{log.productName}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">{log.reason || 'Opération standard'}</p>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase italic ${
                    log.type === 'entry' ? 'bg-emerald-50 text-emerald-600' : 
                    log.type === 'exit' ? 'bg-rose-50 text-rose-600' : 
                    log.type === 'transfer' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {log.type}
                  </span>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className={`font-black italic text-sm ${log.changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {log.changeAmount >= 0 ? `+${log.changeAmount}` : log.changeAmount}
                  </span>
                </td>
                <td className="px-10 py-6 text-right font-black text-slate-900 text-sm">
                  {log.finalStock}
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-slate-900 uppercase">{log.responsible || 'Système_Root'}</p>
                    <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest"><ShieldCheck className="w-2.5 h-2.5" /> Signé</div>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-10 py-32 text-center">
                  <div className="space-y-6 opacity-20 max-w-xs mx-auto">
                    <HistoryIcon className="w-16 h-16 mx-auto text-[#143d21]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-relaxed">Aucun mouvement n'a été enregistré.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 border rounded-[3.5rem] shadow-sm space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner"><User className="w-8 h-8" /></div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Profil Administrateur Pro</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Identité & Certificats de sécurité ERP</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField label="NOM COMPLET" value="Admin_Pro_SS" />
            <InputField label="ADRESSE E-MAIL" value="superviseur@smartstock.pro" />
            <InputField label="RÔLE SYSTÈME" value="Super-Administrateur" readOnly />
            <InputField label="CLÉ DE SIGNATURE" value=".........." type="password" readOnly />
          </div>
          <div className="flex gap-4">
            <button className="px-10 py-5 bg-[#143d21] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Mettre à jour le profil</button>
            <button 
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: "Remise à zéro totale",
                  message: "Attention ! Cette action effacera TOUTES vos données locales (Produits, Mobilier, Historique). Il n'y a pas de retour possible.",
                  type: 'danger',
                  onConfirm: () => {
                    localStorage.clear();
                    window.location.reload();
                  }
                });
              }} 
              className="px-10 py-5 bg-rose-50 text-rose-600 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border border-rose-100 flex items-center gap-2 hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Remise à Zéro Totale
            </button>
          </div>
        </div>
        <div className="bg-[#143d21] p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Sécurité & Persistence</h3>
          </div>
          <div className="space-y-8">
            <ToggleOption label="Auto-sauvegarde Locale" desc="VOS DONNÉES SONT DANS LE NAVIGATEUR" active />
            <ToggleOption label="Audit log blockchain" desc="ENREGISTREMENT CONTINU DES FLUX" active />
            <ToggleOption label="Synchronisation cloud" desc="SAUVEGARDE MIROIR TEMPS RÉEL" />
          </div>
        </div>
      </div>
    </div>
  );

  const ImportView = () => (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
        <ImportCard icon={Camera} title="VISION AUTOMATIQUE" desc="EXTRACTION PAR RECONNAISSANCE VISUELLE" color="emerald" onFile={handleFileUpload} />
        <ImportCard icon={FileSpreadsheet} title="IMPORTATION MASSIVE" desc="INTÉGRATION FICHIER STRUCTURE CSV/EXCEL" color="blue" onFile={handleFileUpload} />
      </div>
    </div>
  );

  const ReportView = () => (
    <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      {aiReport ? (
        <div className="bg-white w-full max-w-4xl rounded-[4rem] p-12 shadow-2xl border-t-8 border-[#143d21] space-y-8 overflow-y-auto max-h-[80vh] animate-modal">
          <div className="flex justify-between items-center">
             <h3 className="text-2xl font-black italic uppercase tracking-tighter">Rapport d'Audit Automatique</h3>
             <button onClick={() => setAiReport(null)} className="p-4 bg-slate-100 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-6 text-left">
            <div>
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Résumé Exécutif</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{aiReport.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-2">Alertes Critiques</h4>
                <ul className="space-y-2">
                  {aiReport.criticalAlerts.map((a, i) => <li key={i} className="text-[11px] font-bold text-rose-600 bg-rose-50 p-3 rounded-xl flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {a}</li>)}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Recommandations</h4>
                <ul className="space-y-2">
                  {aiReport.recommendations.map((r, i) => <li key={i} className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl flex items-start gap-2"><ShieldCheck className="w-4 h-4 shrink-0" /> {r}</li>)}
                </ul>
              </div>
            </div>
            <div className="p-6 bg-[#143d21] rounded-3xl text-white shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-400">Projection Financière</h4>
              <p className="text-sm font-black italic">{aiReport.financialProjection}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white w-full max-w-3xl rounded-[3rem] p-16 shadow-2xl border-t-8 border-[#143d21] text-center space-y-10">
          <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><BarChart3 className="w-12 h-12 text-[#143d21]" /></div>
          <div className="space-y-4">
            <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Certification Logistique Automatique</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">Analyse instantanée de vos données locales par l'Automatique.</p>
          </div>
          <button onClick={handleAiReport} disabled={isAiLoading || products.length === 0} className="px-12 py-6 bg-[#143d21] text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 mx-auto hover:bg-black transition-all disabled:opacity-50">
            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {products.length === 0 ? "Ajoutez des articles pour l'audit" : "Générer le rapport officiel"}
          </button>
        </div>
      )}
    </div>
  );

  const StudioView = () => {
    const [studioPrompt, setStudioPrompt] = useState('');
    const [studioResult, setStudioResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateStudioImage = async () => {
      if (!studioPrompt) return;
      setIsGenerating(true);
      try {
        const res = await generateProductImage(studioPrompt);
        setStudioResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
        <div className="bg-white w-full max-w-3xl rounded-[3rem] p-12 shadow-2xl border flex flex-col gap-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner"><ImageIcon className="w-8 h-8 text-[#143d21]" /></div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Studio Photo Automatique</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Génération de visuels catalogue par Automatique</p>
            </div>
          </div>
          <textarea 
            value={studioPrompt}
            onChange={(e) => setStudioPrompt(e.target.value)}
            placeholder="Décrivez l'actif à visualiser (ex: Bureau exécutif en chêne sombre, éclairage doux)..." 
            className="w-full h-48 p-8 bg-slate-50 rounded-[2rem] outline-none font-bold text-slate-900 resize-none italic focus:bg-white transition-all border-none" 
          />
          {studioResult && (
            <div className="relative group rounded-[2rem] overflow-hidden border">
              <img src={studioResult} alt="Generated asset" className="w-full aspect-square object-cover" />
              <button onClick={() => setStudioResult(null)} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button>
            </div>
          )}
          <button 
            onClick={handleGenerateStudioImage}
            disabled={isGenerating || !studioPrompt}
            className="w-full py-8 bg-black text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Générer le visuel professionnel
          </button>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-emerald-300 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-blue-300 rounded-full blur-[150px]" />
      </div>

      <div className="bg-white p-12 lg:p-24 rounded-[5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] w-full max-w-3xl space-y-16 border relative animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex p-10 bg-[#143d21] rounded-[3.5rem] text-white shadow-2xl ring-8 ring-emerald-50 animate-bounce-slow">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <div className="space-y-4">
            <h2 className="text-7xl lg:text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">SmartStock</h2>
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.5em] italic">Enterprise Logistical Operating System • v4.0</p>
          </div>
          <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
            Bienvenue dans votre plateforme de gestion de stock intelligente. Connectez-vous pour accéder à vos inventaires et audits Automatiques.
          </p>
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => {
              setIsLoggedIn(true);
              showToast("Connexion sécurisée établie");
            }} 
            className="group w-full py-8 bg-[#143d21] text-white rounded-[3.5rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4"
          >
            Démarrer la session <ArrowRightLeft className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <aside className="fixed inset-y-0 left-0 z-50 w-80 bg-[#143d21] m-6 rounded-[3.5rem] p-8 flex flex-col text-white shadow-2xl">
        <div className="mb-10 px-4 py-2 border-b border-white/5 pb-8 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">SmartStock</h1>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-2">
          <NavItem active={activeView === 'dashboard'} onClick={()=>setActiveView('dashboard')} icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem active={activeView === 'inventory'} onClick={()=>setActiveView('inventory')} icon={Box} label="Stocks / Inventaire" />
          <NavItem active={activeView === 'furniture'} onClick={()=>setActiveView('furniture')} icon={Armchair} label="Mobilier & Actifs" />
          <NavItem active={activeView === 'import'} onClick={()=>setActiveView('import')} icon={Upload} label="Import Automatique" />
          <NavItem active={activeView === 'history'} onClick={()=>setActiveView('history')} icon={HistoryIcon} label="Historique / Audit" />
          <NavItem active={activeView === 'monthly_report'} onClick={()=>setActiveView('monthly_report')} icon={FileText} label="Reporting Automatique" />
          <NavItem active={activeView === 'studio'} onClick={()=>setActiveView('studio')} icon={ImageIcon} label="Studio Photo" />
          <NavItem active={activeView === 'settings'} onClick={()=>setActiveView('settings')} icon={SettingsIcon} label="Paramètres" />
        </nav>
        
        <button 
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: "Déconnexion sécurisée",
              message: "Souhaitez-vous fermer votre session de travail actuelle ? Toutes vos données resteront enregistrées localement.",
              type: 'info',
              onConfirm: () => {
                setIsLoggedIn(false);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }
            });
          }} 
          className="mt-8 flex items-center justify-center gap-3 py-5 bg-white/5 hover:bg-rose-600 text-white/50 hover:text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest transition-all"
        >
          <LogOut className="w-4 h-4" /> Quitter l'ERP
        </button>
      </aside>

      <main className="flex-1 p-10 lg:p-14 lg:ml-80">
        <header className="flex justify-between items-center mb-12">
          <div className="space-y-3">
            <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{viewLabels[activeView] || activeView}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Système de gestion industrielle opérationnel
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-3 bg-white border rounded-full text-[10px] font-black text-slate-800 shadow-sm"><Globe className="w-4 h-4 text-emerald-600" /> DRC_HQ_01</div>
            <button className="p-4 bg-white border rounded-full text-slate-400 shadow-sm hover:text-emerald-600 transition-all"><Printer className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 bg-white border pr-6 p-1.5 rounded-full shadow-sm">
              <div className="w-10 h-10 bg-[#143d21] rounded-full flex items-center justify-center text-white text-xs font-black">AD</div>
              <div className="hidden lg:block"><p className="text-[10px] font-black text-slate-900 uppercase">Admin ERP</p><p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Superviseur Pro</p></div>
            </div>
          </div>
        </header>

        <div className="pb-32">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'furniture' && <FurnitureView />}
          {activeView === 'import' && <ImportView />}
          {activeView === 'history' && <HistoryView />}
          {activeView === 'monthly_report' && <ReportView />}
          {activeView === 'studio' && <StudioView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>

      {isAiLoading && activeView === 'import' && <ExtractionLoader />}
      {isEditModalOpen && <EditModal />}
      <ConfirmationModal />

      {isReviewOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] p-12 shadow-2xl flex flex-col max-h-[90vh] animate-modal">
              <div className="flex justify-between items-center mb-10 shrink-0">
                 <div><h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Vérification Import Automatique</h3><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Validez les données extraites et leur classification.</p></div>
                 <button onClick={() => setIsReviewOpen(false)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 mb-10">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Désignation</th>
                      <th className="px-6 py-4 text-center">Catégorie Automatique</th>
                      <th className="px-6 py-4 text-center">Qté</th>
                      <th className="px-6 py-4 text-right">Prix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {importData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-5 font-black text-xs uppercase italic text-slate-900">{item.name}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase italic border border-emerald-100">{item.category}</span>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-emerald-600">{item.currentStock}</td>
                        <td className="px-6 py-5 text-right font-black italic">{item.unitPrice?.toLocaleString()} Fc</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={confirmImport} className="w-full py-6 bg-[#143d21] text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all">Valider l'Intégration Stock</button>
           </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] px-12 py-8 rounded-[3rem] shadow-2xl border-2 flex items-center gap-6 bg-white animate-in slide-in-from-bottom-10 ${notification.type === 'error' ? 'text-rose-600 border-rose-100' : 'text-[#143d21] border-emerald-100'}`}>
          <Zap className="w-8 h-8" /><p className="text-sm font-bold text-slate-500 italic uppercase">{notification.message}</p>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-8 py-6 transition-all duration-300 group ${active ? 'bg-white text-[#143d21] rounded-full shadow-lg scale-[1.02]' : 'text-white/70 hover:text-white hover:translate-x-1'}`}>
    <Icon className={`w-6 h-6 ${active ? 'text-[#143d21]' : 'text-white/40'}`} />
    <span className="text-[11px] font-black uppercase tracking-[0.1em] text-left leading-tight">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, alert }: any) => (
  <div className={`bg-white p-8 border rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group ${alert ? 'border-rose-100' : ''}`}>
    <div className={`p-4 rounded-2xl w-max mb-6 ${alert ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}><Icon className="w-6 h-6" /></div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <div className="flex items-end justify-between">
      <h4 className={`text-2xl font-black italic tracking-tighter tabular-nums leading-none ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</h4>
      {trend && <span className={`text-[9px] font-black px-3 py-1 rounded-full ${trend.includes('+') ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>{trend}</span>}
    </div>
  </div>
);

const WorkflowAction = ({ icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:bg-white hover:shadow-lg hover:border-slate-100 transition-all group">
    <div className="flex items-center gap-4 text-[10px] font-black text-slate-900 italic uppercase">
      <div className="p-3 bg-white border rounded-xl shadow-sm text-slate-300 group-hover:text-[#143d21] transition-colors"><Icon className="w-4 h-4" /></div>
      {label}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#143d21]" />
  </button>
);

const ImportCard = ({ icon: Icon, title, desc, color, onFile }: any) => (
  <label className={`bg-white p-12 border-4 border-dashed border-slate-100 rounded-[4rem] text-center space-y-8 hover:border-${color}-500/20 hover:shadow-2xl transition-all cursor-pointer group relative`}>
    <input type="file" className="hidden" onChange={onFile} />
    <div className={`w-24 h-24 bg-${color}-50 text-${color}-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner transition-transform group-hover:scale-105 duration-300`}><Icon className="w-12 h-12" /></div>
    <div className="space-y-3">
      <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{title}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{desc}</p>
    </div>
  </label>
);

const InputField = ({ label, value, readOnly, type = "text" }: any) => (
  <div className="space-y-3">
    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</label>
    <input 
      type={type} 
      defaultValue={value} 
      readOnly={readOnly}
      className={`w-full p-5 bg-slate-50 rounded-2xl outline-none font-black italic text-sm ${readOnly ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 transition-all'}`} 
    />
  </div>
);

const ToggleOption = ({ label, desc, active }: any) => (
  <div className="flex justify-between items-center group">
    <div className="space-y-1">
      <p className="text-sm font-black italic uppercase tracking-tighter">{label}</p>
      <p className="text-[8px] font-black text-emerald-100/40 uppercase tracking-widest">{desc}</p>
    </div>
    <button className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-white/10'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const viewLabels: Record<ViewType, string> = {
  dashboard: 'TABLEAU DE BORD',
  inventory: 'STOCKS / INVENTAIRE',
  furniture: 'MOBILIER & ACTIFS',
  import: 'IMPORT AUTOMATIQUE',
  history: 'HISTORIQUE / AUDIT',
  monthly_report: 'REPORTING AUTOMATIQUE',
  studio: 'STUDIO PHOTO',
  settings: 'PARAMÈTRES SYSTÈME',
  replenishment: 'RÉAPPROVISIONNEMENT',
  suppliers: 'FOURNISSEURS',
  sites: 'RÉSEAU LOGISTIQUE',
  analytics: 'ANALYSES',
  forecasting: 'PRÉVISIONS'
};

export default App;
