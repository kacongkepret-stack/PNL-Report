"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { createNewProperty, updateProperty, createNewUser, uploadLogo } from './actions';
import { Building2, UserPlus, ShieldAlert, CheckCircle2, AlertCircle, Edit2, PlusCircle, UploadCloud } from 'lucide-react';

export default function AdminControlTower() {
  const [properties, setProperties] = useState([]);
  const fileInputRef = useRef(null);
  
  // STATE MODE FORM PROPERTY
  const [editingPropId, setEditingPropId] = useState(null);
  
  // STATE DATA PROPERTY
  const [propName, setPropName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // STATE BARU: FILE & PREVIEW GAMBAR
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [currentSavedLogo, setCurrentSavedLogo] = useState(''); // Menyimpan url lama saat mode edit
  
  // STATE DATA USER
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [selectedProp, setSelectedProp] = useState('none');

  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'super_admin') {
          setIsSuperAdmin(true);
          const { data: props } = await supabase.from('properties').select('*').order('name');
          setProperties(props || []);
        }
      }
      setLoading(false);
    }
    checkAccess();
  }, []);

  // MENANGKAP FILE PICKER & MEMBUAT PRATINJAU LOKAL
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file)); // Stream lokal untuk preview di browser
    }
  };

  const startEditProperty = (prop) => {
    setEditingPropId(prop.id);
    setPropName(prop.name);
    setCompanyName(prop.company_name || '');
    setAddress(prop.address || '');
    setPhone(prop.phone || '');
    setLogoFile(null);
    setLogoPreviewUrl('');
    setCurrentSavedLogo(prop.logo_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetPropertyForm = () => {
    setEditingPropId(null);
    setPropName('');
    setCompanyName('');
    setAddress('');
    setPhone('');
    setLogoFile(null);
    setLogoPreviewUrl('');
    setCurrentSavedLogo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setStatus({ type: 'loading', msg: 'Sedang memproses dokumen dan file gambar...' });
    
    try {
      let finalLogoUrl = editingPropId ? currentSavedLogo : '';

      // JIKA USER MEMILIH FILE BARU, JALANKAN ENGINE UPLOAD SERVER ACTION
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        finalLogoUrl = await uploadLogo(formData);
      }

      const payload = { name: propName, company_name: companyName, address, phone, logo_url: finalLogoUrl };
      
      if (editingPropId) {
        const updated = await updateProperty(editingPropId, payload);
        setProperties(prev => prev.map(p => p.id === editingPropId ? updated : p));
        setStatus({ type: 'success', msg: `Data Properti "${updated.name}" Berhasil Diperbarui!` });
      } else {
        const newProp = await createNewProperty(payload);
        setProperties(prev => [...prev, newProp].sort((a,b) => a.name.localeCompare(b.name)));
        setStatus({ type: 'success', msg: `Properti "${newProp.name}" Berhasil Terdaftar!` });
      }
      resetPropertyForm();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createNewUser({ username, pass: password, role, propertyId: selectedProp });
      setUsername('');
      setPassword('');
      setStatus({ type: 'success', msg: `User "${username}" Berhasil Dibuat!` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  if (loading) return <div className="p-8 text-center font-mono text-xs">OTENTIKASI SISTEM KONTROL...</div>;
  if (!isSuperAdmin) return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white font-mono p-6">
      <ShieldAlert size={48} className="text-red-500 mb-4" />
      <h1 className="text-lg font-black tracking-widest">AKSES DITOLAK</h1>
      <p className="text-[10px] text-slate-400 mt-2 uppercase">Halaman ini hanya untuk otoritas tertinggi (Super Admin).</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-mono text-xs text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <span className="text-slate-500 font-bold text-[10px] tracking-widest uppercase">System Master Node</span>
            <h1 className="text-xl font-black uppercase text-slate-950">SUPER ADMIN CONTROL TOWER</h1>
          </div>
          <button onClick={() => window.location.href = '/dashboard'} className="px-3 py-1.5 bg-slate-900 text-white font-bold uppercase rounded hover:bg-sky-700 transition-colors">Kembali ke Dashboard</button>
        </div>

        {status.msg && (
          <div className={`p-4 rounded-lg flex items-center gap-3 border ${status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : status.type === 'loading' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {status.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="font-bold">{status.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PANEL KIRI: SETUP PROPERTI */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className={editingPropId ? "text-amber-500" : "text-sky-600"} />
                <h2 className="text-sm font-black text-slate-900 uppercase">
                  {editingPropId ? `Edit Properti: ${propName}` : "Setup Klien Baru (Provisioning)"}
                </h2>
              </div>
              {editingPropId && (
                <button onClick={resetPropertyForm} className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                  <PlusCircle size={12}/> Batal Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handlePropertySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase">Nama Properti (Sistem) <span className="text-red-500">*</span></label>
                <input type="text" value={propName} onChange={(e) => setPropName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-bold" placeholder="CONTOH: Grand Santhi Hotel" required disabled={isUploading} />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase">Nama Entitas Bisnis / PT</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-bold" placeholder="CONTOH: PT. Santhi Bali Property" disabled={isUploading} />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase">Alamat Properti</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-bold resize-none h-16" placeholder="Jalan Patih Jelantik No. 1..." disabled={isUploading} />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase">Kontak / Telepon</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-bold" placeholder="0361 - XXXXX" disabled={isUploading} />
              </div>

              {/* INTERFACE BARU: UPLOAD FILE LOGO */}
              <div className="space-y-2">
                <label className="font-bold text-slate-500 uppercase">File Gambar Logo Properti</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg relative hover:bg-slate-100/70 transition-all">
                  <UploadCloud size={24} className="text-slate-400 shrink-0" />
                  <div className="space-y-0.5 flex-grow">
                    <p className="font-bold text-slate-700">Pilih berkas dari komputer</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Format PNG/JPG ukuran direkomendasikan kotak</p>
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                </div>

                {/* AREA PRATINJAU GAMBAR (LIVE PREVIEW) */}
                {(logoPreviewUrl || currentSavedLogo) && (
                  <div className="p-3 bg-slate-900 rounded-lg flex items-center gap-4 border border-slate-800">
                    <div className="w-12 h-12 bg-white rounded border border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={logoPreviewUrl || currentSavedLogo} alt="Preview Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">{logoPreviewUrl ? 'Berkas Baru Siap Diupload' : 'Berkas Terarsip di Server'}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase truncate max-w-xs">{logoFile ? logoFile.name : 'Using Active Logo'}</p>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isUploading} className={`w-full text-white py-3 rounded font-black uppercase tracking-wider transition-colors ${editingPropId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-950 hover:bg-sky-700'} disabled:opacity-50`}>
                {editingPropId ? "Simpan Perubahan Properti" : "Daftarkan Properti"}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <p className="font-bold text-slate-400 uppercase border-b pb-1 mb-2">Daftar Klien Terkoneksi ({properties.length})</p>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                {properties.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {p.logo_url && (
                        <div className="w-8 h-8 bg-white border rounded p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={p.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-800 uppercase">{p.name}</p>
                        {p.address && <p className="text-[9px] text-slate-500 font-bold mt-0.5">{p.address}</p>}
                      </div>
                    </div>
                    <button onClick={() => startEditProperty(p)} className="flex items-center gap-1 text-[10px] bg-white border border-slate-300 font-black text-slate-600 px-2 py-1 rounded hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all uppercase shadow-sm">
                      <Edit2 size={10} /> Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PANEL KANAN: BUAT USER BARU */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus size={16} className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase">Distribusi Akun User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase">Pseudo-Username <span className="text-red-500">*</span></label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-bold" placeholder="CONTOH: admin@grandsanthi" required />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase">Password Akses <span className="text-red-500">*</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-bold" placeholder="Minimal 6 Karakter" minLength={6} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Level Otoritas</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 font-bold rounded cursor-pointer">
                    <option value="user">PROPERTY USER (STAFF)</option>
                    <option value="admin">PROPERTY ADMIN</option>
                    <option value="super_admin">SUPER ADMIN (DEWA)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Plotting Hotel <span className="text-red-500">*</span></label>
                  <select value={selectedProp} onChange={(e) => setSelectedProp(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 font-bold rounded cursor-pointer uppercase">
                    <option value="none">-- PILIH HOTEL --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-950 text-white py-3 rounded font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors">Generate Akun Klien</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}