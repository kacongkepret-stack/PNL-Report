// app/dashboard/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Activity, Users, Briefcase, Percent, FileText, Database, Building2, Lock, LayoutGrid, Edit3, Settings, LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { createRoot } from "react-dom/client";
import ExportChartPanel from "@/components/ExportChartPanel";
import {
  getAggregatedData, extractVal, formatRp, formatNum, monthsList, yearsList,
} from "@/lib/aggregation";

// ========== INDEX MENU ==========
const indexMenuRev = [
  { id: "TOTAL_REVENUE", label: "TOTAL REVENUE" },
  { id: "ROOM", label: "ROOM REVENUE" },
  { id: "FB", label: "F&B REVENUE" },
  { id: "MEETING", label: "MEETING REVENUE" },
  { id: "OTHERS", label: "OTHER REVENUE" },
];
const indexMenuCost = [
  { id: "COST_FB", label: "COST OF F&B" },
  { id: "PAYROLL", label: "PAYROLL" },
  { id: "ENERGY", label: "ENERGY COST" },
  { id: "OTHER_EXP", label: "OTHER EXPENSES" },
  { id: "NON_OP", label: "NON OPERATING" },
];
const indexMenuGop = [{ id: "GOP", label: "GROSS OPERATING PROFIT" }];
const indexMenuStat = [
  { id: "STAT_OCC", label: "OCCUPANCY & ROOM SOLD" },
  { id: "STAT_ADR", label: "ADR (AVG DAILY RATE)" },
  { id: "STAT_REVPAR", label: "REVPAR" },
  { id: "STAT_PAX", label: "TOTAL GUEST (PAX)" },
];

const ALL_DEPTS = [...indexMenuRev, ...indexMenuCost, ...indexMenuGop, ...indexMenuStat];

const lblDept: Record<string, string> = {
  TOTAL_REVENUE: "Total Revenue", ROOM: "Room Revenue", FB: "F&B Revenue", MEETING: "Meeting Revenue",
  OTHERS: "Other Revenue", COST_FB: "Cost of F&B", PAYROLL: "Payroll", OTHER_EXP: "Other Expenses",
  ENERGY: "Energy Cost", NON_OP: "Non Operating", GOP: "Gross Operating Profit", STAT_OCC: "Occupancy & Room Sold",
  STAT_ADR: "ADR (Avg Daily Rate)", STAT_REVPAR: "RevPAR", STAT_PAX: "Total Guest (Pax)",
};

const PIE_COLORS = ["#ffc107", "#10b981"];

// ========== UTILITY: LOGO LOADER DENGAN RETRIEVAL DIMENSI ASLI ==========
interface LogoData {
  base64: string;
  width: number;
  height: number;
}

const loadLogoData = (url: string): Promise<LogoData | null> => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL("image/png");
        resolve({ base64: dataURL, width: img.width, height: img.height });
      } catch (err) {
        console.error("Gagal enkripsi base64 gambar:", err);
        resolve(null); 
      }
    };
    img.onerror = () => resolve(null);
  });
};

export default function Dashboard() {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const prevMonthYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
  const prevMonth = String(prevMonthIndex + 1).padStart(2, "0");

  const [selectedYear, setSelectedYear] = useState<string>(String(prevMonthYear));
  const [selectedMonth, setSelectedMonth] = useState<string>(prevMonth);
  const [isYTD, setIsYTD] = useState<boolean>(false);

  const [activePropId, setActivePropId] = useState<string>("");
  const [activePropName, setActivePropName] = useState<string>("");
  const [activePropLogo, setActivePropLogo] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [propList, setPropList] = useState<any[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [compareMode, setCompareMode] = useState<string>("BUDGET");
  const [compareYear, setCompareYear] = useState<string>("2025");
  const [activeDept, setActiveDept] = useState<string>("TOTAL_REVENUE");
  const [showBudget, setShowBudget] = useState<boolean>(true);

  const [dbData, setDbData] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);

  useEffect(() => {
    async function initDashboardAuth() {
      const role = localStorage.getItem("userRole");
      const savedPropId = localStorage.getItem("propertyId");
      if (!role) { router.push("/login"); return; }
      setUserRole(role);

      if (role === "super_admin") {
        const { data: props } = await supabase.from("properties").select("*").order("name");
        setPropList(props || []);
        if (props && props.length > 0) {
          setActivePropId(props[0].id);
          setActivePropName(props[0].name);
          setActivePropLogo(props[0].logo_url || "");
        }
      } else {
        const { data: currentProp } = await supabase.from("properties").select("*").eq("id", savedPropId).single();
        if (currentProp) {
          setActivePropId(currentProp.id);
          setActivePropName(currentProp.name);
          setActivePropLogo(currentProp.logo_url || "");
        }
      }
      setIsAuthChecking(false);
    }
    initDashboardAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthChecking || !activePropId) return;
    async function fetchLedgerData() {
      setIsLoadingDB(true);
      const { data, error } = await supabase.from("hotel_finance_reports").select("*").eq("property_id", activePropId);
      if (error) console.error("DB Fetch Error:", error);
      else setDbData(data || []);
      setIsLoadingDB(false);
    }
    fetchLedgerData();
  }, [activePropId, isAuthChecking]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const handlePropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const target = propList.find((p) => p.id === id);
    if (target) {
      setActivePropId(id);
      setActivePropName(target.name);
      setActivePropLogo(target.logo_url || "");
    }
  };

  const mainStats = useMemo(() => getAggregatedData(selectedYear, selectedMonth, isYTD, dbData, activePropId), [selectedYear, selectedMonth, isYTD, dbData, activePropId]);
  const isRpFormat = (dept: string) => !["STAT_OCC", "STAT_PAX"].includes(dept);
  const isCostOrGop = (dept: string) => ["COST_FB", "PAYROLL", "OTHER_EXP", "ENERGY", "NON_OP", "GOP"].includes(dept);

  const renderDashboardPanel = (yearStr: string, isCompact: boolean) => {
    const data = getAggregatedData(yearStr, selectedMonth, isYTD, dbData, activePropId);
    const actualValue = extractVal(data, activeDept, false);
    const budgetValue = extractVal(data, activeDept, true);
    const variance = actualValue - budgetValue;

    const monthsToShow = isYTD ? monthsList.slice(0, parseInt(selectedMonth)) : monthsList;

    const barChartData = (() => {
      if (activeDept === "TOTAL_REVENUE") {
        if (isYTD) {
          return monthsToShow.map((m) => {
            const mData = getAggregatedData(yearStr, m.value, false, dbData, activePropId);
            return { name: m.label.substring(0, 3), Room: mData.rev_room_act || 0, "F&B": mData.rev_fb_act || 0, Meet: mData.rev_meet_act || 0, Others: mData.rev_oth_act || 0 };
          });
        } else {
          return [
            { name: "Room", Actual: data.rev_room_act, Target: data.rev_room_bud },
            { name: "F&B", Actual: data.rev_fb_act, Target: data.rev_fb_bud },
            { name: "Meet", Actual: data.rev_meet_act, Target: data.rev_meet_bud },
            { name: "Oth", Actual: data.rev_oth_act, Target: data.rev_oth_bud },
          ];
        }
      }
      if (!isYTD) {
        const monthLabel = monthsList.find((m) => m.value === selectedMonth)?.label || "";
        return [{ name: monthLabel.substring(0, 3), Actual: actualValue || 0, Target: budgetValue || 0 }];
      }
      return monthsToShow.map((m) => {
        const mData = getAggregatedData(yearStr, m.value, false, dbData, activePropId);
        return { name: m.label.substring(0, 3), Actual: extractVal(mData, activeDept, false) || 0, Target: extractVal(mData, activeDept, true) || 0 };
      });
    })();

    const pieChartData = isCostOrGop(activeDept) ? [
      { name: activeDept === "GOP" ? "GOP" : "Cost", value: actualValue },
      { name: activeDept === "GOP" ? "Total Expense" : "Revenue", value: Math.max(0, data.totalRevAct - actualValue) },
    ] : [];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
      if (data.totalRevAct <= 0 || value <= 0) return null;
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const percent = ((value / data.totalRevAct) * 100).toFixed(0);
      return (
        <text x={cx + radius * Math.cos(-midAngle * RADIAN)} y={cy + radius * Math.sin(-midAngle * RADIAN)} fill="#1e293b" textAnchor="middle" dominantBaseline="central" style={{ fontSize: isCompact ? "10px" : "12px", fontWeight: "900", textShadow: "0px 1px 2px rgba(255,255,255,0.5)" }}>
          {percent}%
        </text>
      );
    };

    const dynamicBarSize = (!isYTD || activeDept !== "TOTAL_REVENUE") && barChartData.length <= 2 ? 30 : undefined;

    return (
      <div className={`flex ${isCompact ? "flex-col" : "flex-col md:flex-row"} gap-4 2xl:gap-6`}>
        <div className={`w-full ${isCompact ? "" : "md:w-1/3"} flex flex-col space-y-3 bg-white p-3 2xl:p-5 border border-slate-200 rounded-lg shadow-sm overflow-y-auto`}>
          <div className="border-b border-slate-200 pb-1.5 mb-1"><p className="text-[10px] 2xl:text-xs font-black text-sky-800 uppercase">PERFORMA {yearStr}</p></div>
          <div className="grid grid-cols-2 gap-2 2xl:gap-4">
            <div><p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-0.5">Actual Result</p><p className={`${isCompact ? "text-sm" : "text-base 2xl:text-lg"} font-bold text-slate-950 truncate`}>{isRpFormat(activeDept) ? formatRp(actualValue) : formatNum(actualValue)}</p></div>
            <div><p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-0.5">{activeDept === "STAT_OCC" ? "Target (Sold)" : "Budget Target"}</p><p className={`${isCompact ? "text-xs" : "text-sm 2xl:text-md"} font-bold text-slate-600 truncate`}>{isRpFormat(activeDept) ? formatRp(budgetValue) : formatNum(budgetValue)}</p></div>
          </div>
          <div className="bg-slate-100 border border-slate-200 p-2 2xl:p-3 rounded-lg shadow-inner">
            <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-0.5 tracking-tight">Variance (Act vs Bud)</p>
            <p className={`text-sm 2xl:text-lg font-bold truncate ${variance >= 0 ? isCostOrGop(activeDept) && activeDept !== "GOP" ? "text-red-600" : "text-emerald-600" : isCostOrGop(activeDept) && activeDept !== "GOP" ? "text-emerald-600" : "text-red-600"}`}>
              {variance >= 0 ? "+" : ""}{isRpFormat(activeDept) ? formatRp(variance) : formatNum(variance)}
            </p>
          </div>
          {activeDept === "TOTAL_REVENUE" && (
            <div className="border-t border-slate-100 pt-2 space-y-1">
              <div className="flex justify-between text-[9px]"><span>Room Revenue</span><span className="font-bold">{formatRp(data.rev_room_act)}</span></div>
              <div className="flex justify-between text-[9px]"><span>F&B Revenue</span><span className="font-bold">{formatRp(data.rev_fb_act)}</span></div>
              <div className="flex justify-between text-[9px]"><span>Meeting Revenue</span><span className="font-bold">{formatRp(data.rev_meet_act)}</span></div>
              <div className="flex justify-between text-[9px]"><span>Other Revenue</span><span className="font-bold">{formatRp(data.rev_oth_act)}</span></div>
            </div>
          )}
          {activeDept === "STAT_OCC" && (
            <div className="border-t border-slate-100 pt-2 space-y-1 text-[9px]">
              <div className="flex justify-between"><span>Rooms Available (Act)</span><span className="font-bold">{formatNum(data.avail_act)}</span></div>
              <div className="flex justify-between"><span>Rooms Sold (Act)</span><span className="font-bold">{formatNum(data.sold_act)}</span></div>
              <div className="flex justify-between"><span>Occupancy %</span><span className="font-bold">{data.occAct.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>ADR</span><span className="font-bold">{formatRp(data.adrAct)}</span></div>
              <div className="flex justify-between"><span>RevPAR</span><span className="font-bold">{formatRp(data.revparAct)}</span></div>
            </div>
          )}
          {activeDept === "GOP" && (
            <div className="border-t border-slate-100 pt-2 space-y-1 text-[9px]">
              <div className="flex justify-between"><span>Total Revenue</span><span className="font-bold">{formatRp(data.totalRevAct)}</span></div>
              <div className="flex justify-between"><span>Total Expense</span><span className="font-bold">{formatRp(data.totalExpAct)}</span></div>
              <div className="flex justify-between font-black text-[11px] border-t pt-1"><span>GOP</span><span>{formatRp(data.gop_act)}</span></div>
            </div>
          )}
        </div>
        <div id={`chart-${yearStr}`} className={`w-full ${isCompact ? "h-[200px] lg:h-[220px] 2xl:h-[300px]" : "md:w-2/3 border-l border-slate-200 pl-4 2xl:pl-6 h-[220px] lg:h-[250px] 2xl:h-[360px]"}`}>
          <ResponsiveContainer width="100%" height="100%">
            {isCostOrGop(activeDept) ? (
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={isCompact ? 70 : 100} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                  {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />))}
                </Pie>
                <Tooltip formatter={(value: any) => formatRp(Number(value))} contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "6px" }} />
                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: "9px", fontWeight: "bold", color: "#1e293b" }} />
              </PieChart>
            ) : (
              <BarChart data={barChartData as any[]} margin={{ top: 0, right: 0, left: -15, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => !isRpFormat(activeDept) ? formatNum(v as number) : `Rp${((v as number) / 1000000).toFixed(0)}M`} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(v: any) => !isRpFormat(activeDept) ? formatNum(Number(v)) : formatRp(Number(v))} contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "6px" }} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: "9px", paddingTop: "10px", color: "#1e293b" }} />
                {activeDept === "TOTAL_REVENUE" && isYTD ? (
                  <>
                    <Bar dataKey="Room" name="Room" fill="#0ea5e9" barSize={10} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="F&B" name="F&B" fill="#f59e0b" barSize={10} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Meet" name="Meeting" fill="#10b981" barSize={10} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Others" name="Others" fill="#8b5cf6" barSize={10} radius={[2, 2, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="Actual" name={`Actual ${yearStr}`} fill="#0ea5e9" barSize={dynamicBarSize} maxBarSize={30} radius={[2, 2, 0, 0]} />
                    {showBudget && <Bar dataKey="Target" name={`Budget ${yearStr}`} fill="#cbd5e1" barSize={dynamicBarSize} maxBarSize={30} radius={[2, 2, 0, 0]} />}
                  </>
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ========== DRAW PDF NATIVE HEADER DENGAN ASPEK RATIO PROPORSIONAL + LIGHT THEME ==========
  const drawPDFHeader = (pdf: jsPDF, pageNum: number, totalPages: number | string, logoData: LogoData | null) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const monthLabel = monthsList.find((m) => m.value === selectedMonth)?.label || "";
    const periodeText = isYTD ? `YTD Jan - ${monthLabel} ${selectedYear}` : `${monthLabel} ${selectedYear}`;

    // PERBAIKAN: Mengubah Background Header Menjadi Putih Bersih (Light Corporate Theme)
    pdf.setFillColor(255, 255, 255); 
    pdf.rect(0, 0, pageWidth, 28, "F");
    
    // Garis Batas Atas Tebal (Dark Navy Accent)
    pdf.setFillColor(15, 23, 42); 
    pdf.rect(0, 0, pageWidth, 2, "F");

    // Garis Batas Bawah Tipis (Border Divider Slate)
    pdf.setFillColor(226, 232, 240); 
    pdf.rect(0, 27.5, pageWidth, 0.5, "F");

    let textStartX = 12;

    // PERBAIKAN LOGO: Kalkulasi otomatis tinggi & lebar agar tidak gepeng/kegencet
    if (logoData) {
      try {
        const maxBoundingHeight = 16; // Batas tinggi maksimum logo di header (dalam mm)
        const aspectRatio = logoData.width / logoData.height;
        
        let calculatedWidth = maxBoundingHeight * aspectRatio;
        let calculatedHeight = maxBoundingHeight;

        // Cegah logo horizontal terlalu lebar merusak teks judul
        if (calculatedWidth > 45) {
          calculatedWidth = 45;
          calculatedHeight = calculatedWidth / aspectRatio;
        }

        // Posisi Y tengah otomatis di dalam wadah bar header setinggi 28mm
        const optimalYPos = (28 - calculatedHeight) / 2;

        pdf.addImage(logoData.base64, "PNG", 12, optimalYPos, calculatedWidth, calculatedHeight);
        textStartX = 12 + calculatedWidth + 5; // Jarak dinamis teks dari logo
      } catch (e) {
        console.error("Gagal melakukan penempelan asset logo proporsional:", e);
      }
    }

    // PERBAIKAN: Mengubah Warna Teks Menjadi Gelap Kontras Tinggi Agar Terbaca Sempurna
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(activePropName.toUpperCase(), textStartX, 13);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text("EXECUTIVE FINANCIAL SUMMARY", textStartX, 19);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42); 
    pdf.text(periodeText.toUpperCase(), pageWidth - 12, 16, { align: "right" });

    // Footer Dokumen
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105); 
    pdf.text("STRICTLY CONFIDENTIAL", 12, pageHeight - 8);
    
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Generated on ${new Date().toLocaleDateString("id-ID")} by Management Portal`, pageWidth / 2, pageHeight - 8, { align: "center" });
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 12, pageHeight - 8, { align: "right" });
  };

  // ========== EXPORT SINGLE CHART ==========
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const logoData = activePropLogo ? await loadLogoData(activePropLogo) : null;
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 12;
      let yPos = 38; 

      drawPDFHeader(pdf, 1, 1, logoData);

      // KPI Section Background
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos, pageWidth - (margin * 2), 22, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, yPos, pageWidth - (margin * 2), 22, "S");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text("KEY PERFORMANCE INDICATORS", margin + 4, yPos + 7);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      const kpis = [
        `GOP: ${formatRp(mainStats.gop_act)}`,
        `OCCUPANCY: ${mainStats.occAct.toFixed(1)}%`,
        `REVPAR: ${formatRp(mainStats.revparAct)}`,
        `F&B RATIO: ${mainStats.fbCostRatio.toFixed(1)}%`
      ];
      
      pdf.text(kpis[0], margin + 4, yPos + 15);
      pdf.text(kpis[1], margin + 50, yPos + 15);
      pdf.text(kpis[2], margin + 95, yPos + 15);
      pdf.text(kpis[3], margin + 145, yPos + 15);
      
      yPos += 30;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${(lblDept[activeDept] || activeDept).toUpperCase()} - ACTUAL VS BUDGET`, margin, yPos);
      yPos += 5;

      const chartEl = document.getElementById(`chart-${selectedYear}`);
      if (chartEl) {
        const canvas = await html2canvas(chartEl, { scale: 2, backgroundColor: "#ffffff", logging: false });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 15;
      }

      if (compareMode === "YOY") {
        const chartEl2 = document.getElementById(`chart-${compareYear}`);
        if (chartEl2) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`COMPARISON CHART - ${compareYear}`, margin, yPos);
          yPos += 5;

          const canvas2 = await html2canvas(chartEl2, { scale: 2, backgroundColor: "#ffffff", logging: false });
          const imgData2 = canvas2.toDataURL("image/png");
          const imgWidth2 = pageWidth - margin * 2;
          const imgHeight2 = (canvas2.height * imgWidth2) / canvas2.width;
          pdf.addImage(imgData2, "PNG", margin, yPos, imgWidth2, imgHeight2);
        }
      }

      const fileName = `${activePropName.replace(/\s+/g, "-")}_${selectedYear}-${selectedMonth}${isYTD ? "_YTD" : ""}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Gagal mengekspor PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== EXPORT ALL 15 MODULES ==========
  const handleExportAllPDF = async () => {
    setIsExportingAll(true);
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 12;
    let pageNum = 1;
    const totalEstPages = Math.ceil(ALL_DEPTS.length / 2);

    const offScreenDiv = document.createElement("div");
    offScreenDiv.style.position = "absolute";
    offScreenDiv.style.left = "-9999px";
    offScreenDiv.style.top = "0";
    offScreenDiv.style.width = "760px"; 
    offScreenDiv.style.display = "flex";
    offScreenDiv.style.flexDirection = "column";
    offScreenDiv.style.gap = "0px";
    offScreenDiv.style.background = "white";
    document.body.appendChild(offScreenDiv);

    const root = createRoot(offScreenDiv);

    try {
      const logoData = activePropLogo ? await loadLogoData(activePropLogo) : null;

      for (let i = 0; i < ALL_DEPTS.length; i += 2) {
        const deptA = ALL_DEPTS[i];
        const deptB = ALL_DEPTS[i + 1];
        const mainData = getAggregatedData(selectedYear, selectedMonth, isYTD, dbData, activePropId);

        if (pageNum > 1) pdf.addPage();
        drawPDFHeader(pdf, pageNum, totalEstPages, logoData);
        pageNum++;

        // Render Panel A
        root.render(<ExportChartPanel data={mainData} deptId={deptA.id} yearStr={selectedYear} month={selectedMonth} isYTD={isYTD} dbData={dbData} activePropId={activePropId} height={420} />);
        await new Promise((resolve) => setTimeout(resolve, 300));
        let canvas = await html2canvas(offScreenDiv, { scale: 2, backgroundColor: "#ffffff", logging: false });
        let imgData = canvas.toDataURL("image/png");
        let imgWidth = pageWidth - (margin * 2);
        let imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", margin, 38, imgWidth, imgHeight);

        // Render Panel B (Jika Ada)
        if (deptB) {
          root.render(<ExportChartPanel data={mainData} deptId={deptB.id} yearStr={selectedYear} month={selectedMonth} isYTD={isYTD} dbData={dbData} activePropId={activePropId} height={420} />);
          await new Promise((resolve) => setTimeout(resolve, 300));
          canvas = await html2canvas(offScreenDiv, { scale: 2, backgroundColor: "#ffffff", logging: false });
          imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", margin, 38 + imgHeight + 8, imgWidth, imgHeight);
        }
      }

      const fileName = `${activePropName.replace(/\s+/g, "-")}_Full_Executive_Report_${selectedYear}_${selectedMonth}${isYTD ? "_YTD" : ""}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Export Full Report Error:", error);
      alert("Gagal mengekspor laporan lengkap.");
    } finally {
      root.unmount();
      document.body.removeChild(offScreenDiv);
      setIsExportingAll(false);
    }
  };

  // ========== RENDER UTAMA ==========
  if (isAuthChecking) return <div className="min-h-screen flex items-center justify-center font-mono text-xs">Menyambungkan ke Node Hotel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 lg:p-4 2xl:p-6 font-mono text-xs">
      <div className="flex justify-end gap-2 mb-3 2xl:mb-4">
        <button onClick={() => router.push("/input")} className="flex items-center gap-1.5 px-2 py-1 2xl:px-3 2xl:py-1.5 bg-white border border-slate-200 rounded text-[9px] 2xl:text-[10px] font-black text-slate-600 hover:text-sky-700 hover:bg-sky-50 shadow-sm uppercase"><Edit3 size={10} /> Input Data</button>
        {userRole === "super_admin" && <button onClick={() => router.push("/admin")} className="flex items-center gap-1.5 px-2 py-1 2xl:px-3 2xl:py-1.5 bg-white border border-slate-200 rounded text-[9px] 2xl:text-[10px] font-black text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 shadow-sm uppercase"><Settings size={10} /> Control Tower</button>}
        <button onClick={handleLogout} className="flex items-center gap-1.5 px-2 py-1 2xl:px-3 2xl:py-1.5 bg-white border border-slate-200 rounded text-[9px] 2xl:text-[10px] font-black text-slate-600 hover:text-red-700 hover:bg-red-50 shadow-sm uppercase"><LogOut size={10} /> Logout</button>
      </div>

      <div className="mb-4 2xl:mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-200 pb-3 2xl:pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 2xl:w-12 2xl:h-12 bg-white border border-slate-200 rounded shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1">
            {activePropLogo ? <img src={activePropLogo} alt="Logo" className="max-w-full max-h-full object-contain" /> : <div className="bg-slate-900 text-white w-full h-full flex items-center justify-center rounded-sm"><LayoutGrid size={16} /></div>}
          </div>
          <div>
            <h1 className="text-base 2xl:text-xl font-black text-slate-900 uppercase tracking-tight">{activePropName}</h1>
            <p className="text-[8px] 2xl:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Multi-Tenant Portal v9.6</p>
          </div>
        </div>

        <div className="flex flex-wrap bg-white border border-slate-200 p-1 rounded items-center gap-1.5 shadow-sm">
          {userRole === "super_admin" && (
            <><select value={activePropId} onChange={handlePropChange} className="bg-sky-50 text-sky-800 font-black border-none text-[10px] 2xl:text-xs focus:outline-none cursor-pointer px-2 py-1 rounded uppercase">{propList.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select><div className="w-px h-4 bg-slate-200"></div></>
          )}
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent font-black text-[10px] 2xl:text-xs px-1 cursor-pointer">{yearsList.map((y) => (<option key={y} value={y}>{y}</option>))}</select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent font-black text-[10px] 2xl:text-xs px-1 cursor-pointer">{monthsList.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}</select>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
            <button onClick={() => setIsYTD(false)} className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${!isYTD ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}>Mth</button>
            <button onClick={() => setIsYTD(true)} className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${isYTD ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}>YTD</button>
          </div>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200">
            <button onClick={() => setCompareMode("BUDGET")} className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${compareMode === "BUDGET" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500"}`}>vs Bud</button>
            <button onClick={() => setCompareMode("YOY")} className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${compareMode === "YOY" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500"}`}>vs YoY</button>
            {compareMode === "YOY" && (<select value={compareYear} onChange={(e) => setCompareYear(e.target.value)} className="ml-1 bg-white text-indigo-700 font-black rounded-sm text-[9px] 2xl:text-[10px] p-0.5 border border-indigo-200">{yearsList.map((y) => (<option key={y} value={y}>{y}</option>))}</select>)}
          </div>
        </div>
      </div>

      {isLoadingDB && <div className="flex items-center justify-center bg-amber-50 p-2 mb-4 rounded border border-amber-200 text-amber-700 font-bold animate-pulse text-[10px]"><Database size={12} className="mr-2" /> Menarik Ledger Data...</div>}

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 2xl:gap-4 mb-4 2xl:mb-6 transition-opacity duration-300 ${isLoadingDB ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
        <div className="bg-white border-l-4 border-l-sky-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200"><p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1"><Briefcase size={8} /> GOP</p><p className="text-sm 2xl:text-lg font-black text-slate-900">{formatRp(mainStats.gop_act)}</p></div>
        <div className="bg-white border-l-4 border-l-emerald-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200"><p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1"><Users size={8} /> OCCUPANCY</p><p className="text-sm 2xl:text-lg font-black text-slate-900">{mainStats.occAct.toFixed(1)}%</p></div>
        <div className="bg-white border-l-4 border-l-indigo-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200"><p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1"><Activity size={8} /> REVPAR</p><p className="text-sm 2xl:text-lg font-black text-slate-900">{formatRp(mainStats.revparAct)}</p></div>
        <div className="bg-white border-l-4 border-l-red-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200"><p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1"><Percent size={8} /> F&B COST</p><p className={`text-sm 2xl:text-lg font-black ${mainStats.fbCostRatio > 32 ? "text-red-600" : "text-emerald-600"}`}>{mainStats.fbCostRatio.toFixed(1)}%</p></div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 2xl:gap-8 transition-opacity duration-300 ${isLoadingDB ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
        <div className="lg:col-span-2 space-y-2 border-r border-slate-200 pr-2 2xl:pr-4">
          <p className="text-[9px] 2xl:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1.5 mb-2 2xl:mb-4">Menu Index</p>
          <ul className="space-y-1">{indexMenuRev.map((item) => (<li key={item.id} onClick={() => setActiveDept(item.id)} className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${activeDept === item.id ? "bg-sky-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{item.label}</li>))}</ul>
          <div className="my-2 2xl:my-3 border-t-2 border-dashed border-slate-200"></div>
          <ul className="space-y-1">{indexMenuCost.map((item) => (<li key={item.id} onClick={() => setActiveDept(item.id)} className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${activeDept === item.id ? "bg-sky-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{item.label}</li>))}</ul>
          <div className="my-2 2xl:my-3 border-t-2 border-dashed border-slate-200"></div>
          <ul className="space-y-1">{indexMenuGop.map((item) => (<li key={item.id} onClick={() => setActiveDept(item.id)} className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${activeDept === item.id ? "bg-sky-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{item.label}</li>))}</ul>
          <div className="my-2 2xl:my-3 border-t-2 border-dashed border-slate-200"></div>
          <ul className="space-y-1">{indexMenuStat.map((item) => (<li key={item.id} onClick={() => setActiveDept(item.id)} className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${activeDept === item.id ? "bg-sky-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{item.label}</li>))}</ul>
        </div>

        <div className="lg:col-span-10">
          <div className="flex justify-between items-center mb-3 2xl:mb-5 border-b border-slate-200 pb-2">
            <span className="text-[11px] 2xl:text-[14px] font-black text-slate-800 uppercase">{lblDept[activeDept]} Analysis</span>
            {!isCostOrGop(activeDept) && (<button onClick={() => setShowBudget(!showBudget)} className="text-[8px] 2xl:text-[10px] font-black uppercase text-sky-700 bg-sky-50 px-2 py-1 2xl:px-3 2xl:py-1.5 rounded border border-sky-100">{showBudget ? "Hide Budget Target" : "Show Budget Target"}</button>)}
          </div>

          {compareMode === "BUDGET" ? (
            <div className="w-full bg-white/50 p-3 2xl:p-6 rounded-lg 2xl:rounded-2xl border border-slate-200 shadow-sm">{renderDashboardPanel(selectedYear, false)}</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-8 w-full">
              <div className="bg-white p-3 2xl:p-6 rounded-lg 2xl:rounded-2xl border border-slate-200 shadow-sm">{renderDashboardPanel(selectedYear, true)}</div>
              <div className="bg-white p-3 2xl:p-6 rounded-lg 2xl:rounded-2xl border border-slate-200 shadow-sm">{renderDashboardPanel(compareYear, true)}</div>
            </div>
          )}

          <div className="mt-6 2xl:mt-10 pt-4 border-t border-slate-200 flex justify-between items-center opacity-60">
            <p className="font-bold text-[8px] 2xl:text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Lock size={10} /> Secure Tenant</p>
            <div className="flex gap-2">
              <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-1.5 bg-slate-900 text-white font-black px-4 py-2 2xl:px-6 2xl:py-3 rounded hover:bg-sky-700 transition-all uppercase tracking-widest text-[8px] 2xl:text-[10px] shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                <FileText size={12} /> {isExporting ? "Mengekspor..." : "Export Chart"}
              </button>
              <button onClick={handleExportAllPDF} disabled={isExportingAll} className="flex items-center gap-1.5 bg-emerald-700 text-white font-black px-4 py-2 2xl:px-6 2xl:py-3 rounded hover:bg-emerald-800 transition-all uppercase tracking-widest text-[8px] 2xl:text-[10px] shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                <FileText size={12} /> {isExportingAll ? "Menyusun..." : "Export Full Report"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}