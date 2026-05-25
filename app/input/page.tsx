"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Building2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ColumnHeader = () => (
  <div className="grid grid-cols-12 gap-2 items-center pb-2 border-b-2 border-slate-300 mb-2">
    <div className="col-span-4"></div>
    <div className="col-span-4 text-[10px] font-black text-sky-700 uppercase text-right">Actual</div>
    <div className="col-span-4 text-[10px] font-black text-slate-500 uppercase text-right">Budget</div>
  </div>
);

const InputRow = ({
  label,
  nameAct,
  nameBud,
  formData,
  handleChange,
}: {
  label: string;
  nameAct: string;
  nameBud: string;
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
    <label className="col-span-4 text-[10px] font-bold text-slate-700 uppercase truncate pr-1">{label}</label>
    <div className="col-span-4">
      <input type="number" name={nameAct} value={formData[nameAct] === 0 ? '' : formData[nameAct]} onChange={handleChange} className="w-full p-1.5 bg-white text-slate-900 border border-slate-300 rounded text-[11px] font-mono text-right outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" placeholder="0" />
    </div>
    <div className="col-span-4">
      <input type="number" name={nameBud} value={formData[nameBud] === 0 ? '' : formData[nameBud]} onChange={handleChange} className="w-full p-1.5 bg-white text-slate-900 border border-slate-300 rounded text-[11px] font-mono text-right outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500" placeholder="0" />
    </div>
  </div>
);

export default function InputDataForm() {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: string; msg: string }>({ type: '', msg: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [userRole, setUserRole] = useState<string>('');
  const [activePropId, setActivePropId] = useState<string>('');
  const [activePropName, setActivePropName] = useState<string>('');
  const [propList, setPropList] = useState<any[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Tahun dinamis
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 9 }, (_, i) => currentYear - 3 + i);
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const [formData, setFormData] = useState<any>({
    year: currentYear,
    month: 1,
    stat_avail_act: 0, stat_avail_bud: 0, stat_sold_act: 0, stat_sold_bud: 0, stat_pax_act: 0, stat_pax_bud: 0,
    rev_room_actual: 0, rev_room_budget: 0, rev_fb_actual: 0, rev_fb_budget: 0, rev_meeting_actual: 0, rev_meeting_budget: 0, rev_others_actual: 0, rev_others_budget: 0,
    cost_fb_actual: 0, cost_fb_budget: 0, exp_payroll_actual: 0, exp_payroll_budget: 0, exp_general_actual: 0, exp_general_budget: 0, pay_admin_act: 0, pay_admin_bud: 0,
    oth_admin_act: 0, oth_admin_bud: 0, exp_energy_actual: 0, exp_energy_budget: 0, gop_act: 0, gop_bud: 0, non_operating_actual: 0, non_operating_budget: 0
  });

  // 1. VERIFIKASI SESI LOGIN
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const propId = localStorage.getItem('propertyId') || '';
    const propName = localStorage.getItem('propertyName') || '';

    if (!role) {
      router.push('/login');
      return;
    }

    setUserRole(role);
    if (role === 'super_admin') {
      supabase.from('properties').select('*').order('name').then(({ data }) => {
        setPropList(data || []);
        if (data && data.length > 0) {
          setActivePropId(data[0].id);
          setActivePropName(data[0].name);
        }
        setIsAuthChecking(false);
      });
    } else {
      setActivePropId(propId);
      setActivePropName(propName);
      setIsAuthChecking(false);
    }
  }, [router]);

  // 2. TARIK DATA BERDASARKAN HOTEL, TAHUN, DAN BULAN
  const fetchData = useCallback(async () => {
    if (!activePropId) return;

    const { data } = await supabase
      .from('hotel_finance_reports')
      .select('*')
      .eq('property_id', activePropId)
      .eq('year', formData.year)
      .eq('month', formData.month)
      .single();

    if (data) {
      setFormData((prev: any) => ({ ...prev, ...data }));
    } else {
      setFormData((prev: any) => ({
        year: prev.year, month: prev.month,
        stat_avail_act: 0, stat_avail_bud: 0, stat_sold_act: 0, stat_sold_bud: 0, stat_pax_act: 0, stat_pax_bud: 0,
        rev_room_actual: 0, rev_room_budget: 0, rev_fb_actual: 0, rev_fb_budget: 0, rev_meeting_actual: 0, rev_meeting_budget: 0, rev_others_actual: 0, rev_others_budget: 0,
        cost_fb_actual: 0, cost_fb_budget: 0, exp_payroll_actual: 0, exp_payroll_budget: 0, exp_general_actual: 0, exp_general_budget: 0, pay_admin_act: 0, pay_admin_bud: 0,
        oth_admin_act: 0, oth_admin_bud: 0, exp_energy_actual: 0, exp_energy_budget: 0, gop_act: 0, gop_bud: 0, non_operating_actual: 0, non_operating_budget: 0
      }));
    }
  }, [formData.year, formData.month, activePropId]);

  useEffect(() => {
    if (!isAuthChecking) fetchData();
  }, [fetchData, isAuthChecking]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: Number(value) }));
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setActivePropId(selectedId);
    setActivePropName(propList.find((p: any) => p.id === selectedId)?.name || '');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: 'loading', msg: 'Menyinkronkan data dengan pusat...' });

    const fullPayload = { ...formData, property_id: activePropId };
    const { id, created_at, updated_at, ...cleanPayload } = fullPayload;

    const { error } = await supabase
      .from('hotel_finance_reports')
      .upsert(cleanPayload, { onConflict: 'property_id,year,month' });

    if (error) {
      setStatus({ type: 'error', msg: `Gagal menyimpan: ${error.message}` });
    } else {
      setStatus({ type: 'success', msg: `Laporan ${activePropName} (Bulan ${formData.month}/${formData.year}) Berhasil Disimpan!` });
    }
    setIsSubmitting(false);
  };

  if (isAuthChecking) return <div className="min-h-screen flex items-center justify-center font-mono text-xs">Otentikasi Identitas...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-900 selection:bg-sky-200">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-xl border border-slate-200">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
          <div>
            <h1 className="text-lg font-black text-sky-800 uppercase tracking-wider">Input & Revisi Operasional</h1>
            <div className="mt-2 inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase">
              {userRole === 'super_admin' ? <Building2 size={12} /> : <Lock size={12} className="text-emerald-400" />}
              {userRole === 'super_admin' ? 'Super Admin Mode' : activePropName}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            {userRole === 'super_admin' && (
               <select 
                 value={activePropId} 
                 onChange={handlePropertyChange} 
                 className="bg-sky-50 border border-sky-200 p-2 text-xs rounded-lg font-black text-sky-800 outline-none focus:border-sky-500 w-full md:w-64 cursor-pointer"
               >
                 {propList.map((p: any) => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
            )}

            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 w-full justify-end">
              <select name="year" value={formData.year} onChange={handleChange} className="bg-white border border-slate-300 p-1.5 text-xs rounded font-bold text-slate-800 outline-none cursor-pointer focus:border-sky-500">
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select name="month" value={formData.month} onChange={handleChange} className="bg-white border border-slate-300 p-1.5 text-xs rounded font-bold text-slate-800 outline-none cursor-pointer focus:border-sky-500">
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* KOLOM KIRI */}
          <div className="space-y-6">
            <ColumnHeader />
            <div>
              <p className="text-[11px] font-black text-sky-600 uppercase mb-2 border-l-4 border-sky-600 pl-2 bg-sky-50 py-1">Statistik</p>
              <InputRow label="Room Available" nameAct="stat_avail_act" nameBud="stat_avail_bud" formData={formData} handleChange={handleChange} />
              <InputRow label="Room Sold" nameAct="stat_sold_act" nameBud="stat_sold_bud" formData={formData} handleChange={handleChange} />
              <InputRow label="Total Guest (Pax)" nameAct="stat_pax_act" nameBud="stat_pax_bud" formData={formData} handleChange={handleChange} />
            </div>
            <div>
              <p className="text-[11px] font-black text-emerald-600 uppercase mb-2 border-l-4 border-emerald-600 pl-2 bg-emerald-50 py-1">Revenue</p>
              <InputRow label="Room Revenue" nameAct="rev_room_actual" nameBud="rev_room_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="F&B Revenue" nameAct="rev_fb_actual" nameBud="rev_fb_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="Meeting Revenue" nameAct="rev_meeting_actual" nameBud="rev_meeting_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="Other Revenue" nameAct="rev_others_actual" nameBud="rev_others_budget" formData={formData} handleChange={handleChange} />
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="space-y-6">
            <ColumnHeader />
            <div>
              <p className="text-[11px] font-black text-red-600 uppercase mb-2 border-l-4 border-red-600 pl-2 bg-red-50 py-1">Biaya & Beban</p>
              <InputRow label="Cost of F&B" nameAct="cost_fb_actual" nameBud="cost_fb_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="Total Payroll" nameAct="exp_payroll_actual" nameBud="exp_payroll_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="Other Expenses" nameAct="exp_general_actual" nameBud="exp_general_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="Total Payroll Admin" nameAct="pay_admin_act" nameBud="pay_admin_bud" formData={formData} handleChange={handleChange} />
              <InputRow label="Other Exp Admin" nameAct="oth_admin_act" nameBud="oth_admin_bud" formData={formData} handleChange={handleChange} />
              <InputRow label="Energy Cost" nameAct="exp_energy_actual" nameBud="exp_energy_budget" formData={formData} handleChange={handleChange} />
              <InputRow label="GOP" nameAct="gop_act" nameBud="gop_bud" formData={formData} handleChange={handleChange} />
              <InputRow label="Non Operating Exp" nameAct="non_operating_actual" nameBud="non_operating_budget" formData={formData} handleChange={handleChange} />
            </div>
          </div>
        </div>

        {/* NOTIFIKASI STATUS */}
        {status.msg && (
          <div className={`mt-8 p-4 text-sm font-bold flex items-center gap-3 rounded-lg border ${status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : status.type === 'loading' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} {status.msg}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button type="submit" disabled={isSubmitting} className="w-full mt-8 bg-slate-900 hover:bg-sky-700 text-white font-black py-4 rounded-lg transition-all uppercase text-sm tracking-widest shadow-xl flex justify-center items-center gap-2">
            {isSubmitting ? 'MEMPROSES DATA...' : `PUSH DATA ${activePropName.toUpperCase()} KE DATABASE`}
        </button>
      </form>
    </div>
  );
}