
import { createClient } from '@supabase/supabase-js';
import { Product, Furniture, InventoryLog } from '../types';

const supabaseUrl = 'https://abirhrgufsnyivhjyegx.supabase.co';
const supabaseKey = 'sb_publishable_veItXNZBzp3Q67iigQdwxg_cCIL2m7H';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service pour la persistance Cloud (Supabase)
 * Gère la synchronisation bidirectionnelle avec le stockage local
 */

export const syncProducts = async (products: Product[]) => {
  try {
    const { error } = await supabase.from('products').upsert(products);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase Sync Error (Products):', err);
  }
};

export const syncFurniture = async (furniture: Furniture[]) => {
  try {
    const { error } = await supabase.from('furniture').upsert(furniture);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase Sync Error (Furniture):', err);
  }
};

export const syncHistory = async (history: InventoryLog[]) => {
  try {
    const { error } = await supabase.from('inventory_history').upsert(history);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase Sync Error (History):', err);
  }
};

export const fetchCloudData = async () => {
  try {
    const [prodRes, furnRes, histRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('furniture').select('*'),
      supabase.from('inventory_history').select('*').order('date', { ascending: false })
    ]);

    return {
      products: prodRes.data as Product[] || [],
      furniture: furnRes.data as Furniture[] || [],
      history: histRes.data as InventoryLog[] || []
    };
  } catch (err) {
    console.error('Supabase Fetch Error:', err);
    return null;
  }
};
