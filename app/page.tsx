"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, BarChart3, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50 selection:bg-sky-200">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_50%_40%_at_50%_50%,#000_60%,transparent_100%)]" />

      <div className="max-w-3xl w-full px-5 text-center space-y-7">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-sky-200/50 shadow-md text-sky-800 text-[10px] font-black uppercase tracking-[0.15em]">
          <ShieldCheck size={13} className="text-sky-600" />
          <span>Sistem Multi‑Tenant Terenkripsi</span>
        </div>

        {/* Judul */}
        <div className="animate-fade-in-up-delay-1 space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Executive <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500">
                Ledger
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-2 bg-sky-200/50 -z-0 blur-sm" />
            </span> Portal
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Platform finansial & analitik terpusat untuk menguasai seluruh properti hotel dalam satu ekosistem real‑time yang aman.
          </p>
        </div>

        {/* Tombol Login */}
        <div className="animate-fade-in-up-delay-2 pt-2 flex justify-center">
          <button
            onClick={() => router.push('/login')}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-8 py-3.5 font-black uppercase tracking-[0.15em] text-white shadow-2xl transition-all duration-300 hover:bg-sky-700 hover:shadow-sky-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <Zap size={16} className="relative z-10" />
            <span className="relative z-10">Masuk ke Sistem</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Kartu Fitur */}
        <div className="animate-fade-in-up-delay-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-8 border-t border-slate-200/60">
          {/* Kartu 1 */}
          <div className="group relative overflow-hidden rounded-xl border border-white/50 bg-white/60 backdrop-blur-md p-4 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/20 hover:-translate-y-0.5">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sky-100/70 blur-xl" />
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700 mb-3 ring-1 ring-sky-200/50">
              <Building2 size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wide">Multi‑Property</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Akses data terisolasi dan aman untuk masing‑masing manajemen hotel.
            </p>
          </div>

          {/* Kartu 2 */}
          <div className="group relative overflow-hidden rounded-xl border border-white/50 bg-white/60 backdrop-blur-md p-4 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-200/20 hover:-translate-y-0.5">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-100/70 blur-xl" />
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-3 ring-1 ring-emerald-200/50">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wide">Dashboard</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              GOP, Cost Ratio, & okupansi dengan perbandingan YoY instan.
            </p>
          </div>

          {/* Kartu 3 */}
          <div className="group relative overflow-hidden rounded-xl border border-white/50 bg-white/60 backdrop-blur-md p-4 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-200/20 hover:-translate-y-0.5">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-100/70 blur-xl" />
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 mb-3 ring-1 ring-indigo-200/50">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wide">Role Access</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Hirarki ketat Super Admin hingga Staff, kendali penuh di tangan Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-3 text-center text-[10px] text-slate-400 font-medium tracking-widest uppercase backdrop-blur-sm px-3 py-1.5 rounded-full bg-white/30 border border-white/40">
        &copy; 2026 Layanan Dokumen Group
      </footer>
    </div>
  );
}