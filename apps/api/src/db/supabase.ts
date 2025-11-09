import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Server-side, no session persistence needed
  },
});

// Export type-safe database interface
export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          qbo_customer_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          qbo_customer_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          qbo_customer_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          account_id: string;
          type: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          type: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          type?: string;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          email: string;
          phone: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          email: string;
          phone?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          variety: string | null;
          grade: string | null;
          default_unit_size: number | null;
          uom: string;
          qbo_item_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          variety?: string | null;
          grade?: string | null;
          default_unit_size?: number | null;
          uom: string;
          qbo_item_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          variety?: string | null;
          grade?: string | null;
          default_unit_size?: number | null;
          uom?: string;
          qbo_item_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_no: string;
          seller_id: string;
          buyer_id: string;
          status: string;
          contract_no: string | null;
          qbo_doc_type: string | null;
          qbo_doc_id: string | null;
          qbo_doc_number: string | null;
          subtotal: number;
          commission_total: number;
          total_amount: number;
          terms: string | null;
          notes: string | null;
          pallet_count: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_no: string;
          seller_id: string;
          buyer_id: string;
          status?: string;
          contract_no?: string | null;
          qbo_doc_type?: string | null;
          qbo_doc_id?: string | null;
          qbo_doc_number?: string | null;
          subtotal?: number;
          commission_total?: number;
          total_amount?: number;
          terms?: string | null;
          notes?: string | null;
          pallet_count?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_no?: string;
          seller_id?: string;
          buyer_id?: string;
          status?: string;
          contract_no?: string | null;
          qbo_doc_type?: string | null;
          qbo_doc_id?: string | null;
          qbo_doc_number?: string | null;
          subtotal?: number;
          commission_total?: number;
          total_amount?: number;
          terms?: string | null;
          notes?: string | null;
          pallet_count?: number | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_lines: {
        Row: {
          id: string;
          order_id: string;
          line_no: number;
          product_id: string;
          size_grade: string | null;
          quantity: number;
          unit_size: number;
          uom: string;
          total_weight: number;
          unit_price: number;
          commission_pct: number | null;
          commission_amt: number | null;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          line_no: number;
          product_id: string;
          size_grade?: string | null;
          quantity: number;
          unit_size: number;
          uom: string;
          total_weight: number;
          unit_price: number;
          commission_pct?: number | null;
          commission_amt?: number | null;
          line_total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          line_no?: number;
          product_id?: string;
          size_grade?: string | null;
          quantity?: number;
          unit_size?: number;
          uom?: string;
          total_weight?: number;
          unit_price?: number;
          commission_pct?: number | null;
          commission_amt?: number | null;
          line_total?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
