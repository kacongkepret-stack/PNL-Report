"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, property_id, properties(name)')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      setErrorMsg("Profil user tidak ditemukan di database.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    localStorage.setItem('userRole', profileData.role);
    if (profileData.property_id) {
      localStorage.setItem('propertyId', profileData.property_id);
      localStorage.setItem('propertyName', profileData.properties?.name || '');
    }

    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 selection:bg-sky-200">
      {/* Background pattern & blob (serupa Home) */}
      <div className="absolute inset-0 -z-10">
        {/* Pola titik halus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#cbd5e1_1px,_transparent_1px)] bg-[length:24px_24px] opacity-40" />
        {/* Blob warna pastel */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-sky-100 blur-3xl opacity-50" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-100 blur-3xl opacity-50" />
      </div>

      {/* Card Login */}
      <div className="animate-fade-in-up w-full max-w-md mx-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-2xl shadow-sky-100/50">
          {/* Header */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-sky-200/50 ring-2 ring-white/80">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
              Ledger <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-emerald-600">System</span>
            </h1>
            <p className="mt-1.5 text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
              Multi-Property Executive Portal
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 animate-fade-in-up">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Email */}
              <div className="animate-fade-in-up-delay-1 space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-sky-400 group-focus-within:text-sky-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:bg-white transition-all shadow-sm"
                    placeholder="admin@hotel.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="animate-fade-in-up-delay-2 space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-sky-400 group-focus-within:text-sky-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:bg-white transition-all shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Tombol Login */}
              <button
                type="submit"
                disabled={loading}
                className="animate-fade-in-up-delay-2 group relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 p-[2px] shadow-lg shadow-sky-200 transition-all hover:shadow-xl hover:shadow-sky-300/50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="relative flex items-center justify-center gap-2 rounded-[10px] bg-white/90 px-6 py-3.5 font-black uppercase tracking-[0.2em] text-slate-700 transition-all group-hover:bg-white">
                  {/* Shimmer */}
                  <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-sky-200/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin relative z-10 text-sky-600" /> <span className="relative z-10">Memverifikasi...</span></>
                  ) : (
                    <span className="relative z-10">Masuk</span>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          &copy; 2026 Layanan Dokumen Group
        </p>
      </div>
    </div>
  );
}