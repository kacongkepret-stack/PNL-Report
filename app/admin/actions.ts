"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validasi preventif untuk mematikan error "supabaseKey is required"
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Kredensial Supabase gagal dimuat. Periksa kembali file .env.local Anda.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 1. ACTION UNTUK UPLOAD FILE GAMBAR LOGO KE STORAGE
export async function uploadLogo(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return null;

  // Konversi berkas menjadi Buffer biner yang dikenali oleh Node.js
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Standarisasi nama file yang aman (Timestamp + Karakter Acak)
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  // Unggah paksa ke bucket 'hotel-logos' menggunakan service_role
  const { data, error } = await supabaseAdmin.storage
    .from('hotel-logos')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw new Error(`Gagal Upload Storage: ${error.message}`);

  // Ambil URL Publik permanen dari gambar yang berhasil diunggah
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('hotel-logos')
    .getPublicUrl(fileName);

  return publicUrl;
}

// 2. ACTION PEMBUAT PROPERTI BARU
export async function createNewProperty(fields: { name: string; company_name?: string; address?: string; phone?: string; logo_url?: string }) {
  const { data, error } = await supabaseAdmin
    .from('properties')
    .insert([fields])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 3. ACTION UPDATE DATA PROPERTI
export async function updateProperty(id: string, fields: { name: string; company_name?: string; address?: string; phone?: string; logo_url?: string }) {
  const { data, error } = await supabaseAdmin
    .from('properties')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 4. ACTION PEMBUAT USER BARU
export async function createNewUser(fields: { username: string; pass: string; role: string; propertyId: string }) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: fields.username,
    password: fields.pass,
    email_confirm: true
  });

  if (authError) throw new Error(authError.message);

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert([
      {
        id: authData.user.id,
        email: fields.username,
        role: fields.role,
        property_id: fields.propertyId === 'none' ? null : fields.propertyId
      }
    ]);

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  return { success: true };
}