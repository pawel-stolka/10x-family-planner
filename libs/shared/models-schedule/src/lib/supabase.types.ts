/**
 * Auto-generated Supabase TypeScript types
 *
 * Run `npm run supabase:gen:types` to regenerate this file
 * from your Supabase database schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {};
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
