"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Users,
  Briefcase,
  Percent,
  FileText,
  Database,
  Building2,
  Lock,
  LayoutGrid,
  Edit3,
  Settings,
  LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const monthsList = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const yearsList: string[] = ["2025", "2026", "2027"];

// Tipe untuk hasil agregasi (opsional, membantu pemahaman)
type AggregatedData = {
  [key: string]: number;
  totalRevAct: number;
  totalRevBud: number;
  totalExpAct: number;
};

// Fungsi agregasi dengan tipe parameter
function getAggregatedData(
  year: string,
  monthStr: string,
  isYTD: boolean,
  dbData: any[],
  activePropId: string
): any {
  const targetMonth = parseInt(monthStr);
  const targetYear = parseInt(year);

  const rows = dbData.filter(
    (d) =>
      d.property_id === activePropId &&
      d.year === targetYear &&
      (isYTD ? d.month <= targetMonth : d.month === targetMonth)
  );

  let sum = {
    avail_act: 0,
    avail_bud: 0,
    sold_act: 0,
    sold_bud: 0,
    pax_act: 0,
    pax_bud: 0,
    paid_act: 0,
    rev_room_act: 0,
    rev_room_bud: 0,
    rev_fb_act: 0,
    rev_fb_bud: 0,
    rev_meet_act: 0,
    rev_meet_bud: 0,
    rev_oth_act: 0,
    rev_oth_bud: 0,
    cost_fb_act: 0,
    cost_fb_bud: 0,
    payroll_act: 0,
    payroll_bud: 0,
    other_exp_act: 0,
    other_exp_bud: 0,
    energy_act: 0,
    energy_bud: 0,
    non_op_act: 0,
    non_op_bud: 0,
    gop_act: 0,
    gop_bud: 0,
  };

  rows.forEach((r) => {
    sum.avail_act += Number(r.stat_avail_act || r.room_available || 0);
    sum.avail_bud += Number(r.stat_avail_bud || r.room_available_budget || 0);
    sum.sold_act += Number(r.stat_sold_act || r.room_sold || 0);
    sum.sold_bud += Number(r.stat_sold_bud || r.room_sold_budget || 0);
    sum.pax_act += Number(r.stat_pax_act || r.guest_pax || 0);
    sum.pax_bud += Number(r.stat_pax_bud || r.guest_pax_budget || 0);
    sum.paid_act += Number(r.room_paid || 0);
    sum.rev_room_act += Number(r.rev_room_actual || 0);
    sum.rev_room_bud += Number(r.rev_room_budget || 0);
    sum.rev_fb_act += Number(r.rev_fb_actual || 0);
    sum.rev_fb_bud += Number(r.rev_fb_budget || 0);
    sum.rev_meet_act += Number(r.rev_meeting_actual || 0);
    sum.rev_meet_bud += Number(r.rev_meeting_budget || 0);
    sum.rev_oth_act += Number(r.rev_others_actual || 0);
    sum.rev_oth_bud += Number(r.rev_others_budget || 0);
    sum.cost_fb_act += Number(r.cost_fb_actual || 0);
    sum.cost_fb_bud += Number(r.cost_fb_budget || 0);
    sum.payroll_act += Number(r.exp_payroll_actual || 0);
    sum.payroll_bud += Number(r.exp_payroll_budget || 0);
    sum.other_exp_act += Number(r.exp_general_actual || 0);
    sum.other_exp_bud += Number(r.exp_general_budget || 0);
    sum.energy_act += Number(r.exp_energy_actual || 0);
    sum.energy_bud += Number(r.exp_energy_budget || 0);
    sum.non_op_act += Number(r.non_operating_actual || 0);
    sum.non_op_bud += Number(r.non_operating_budget || 0);
    sum.gop_act += Number(r.gop_act || 0);
    sum.gop_bud += Number(r.gop_bud || 0);
  });

  const totalRevAct =
    sum.rev_room_act + sum.rev_fb_act + sum.rev_meet_act + sum.rev_oth_act;
  const totalRevBud =
    sum.rev_room_bud + sum.rev_fb_bud + sum.rev_meet_bud + sum.rev_oth_bud;
  const totalExpAct =
    sum.cost_fb_act + sum.payroll_act + sum.other_exp_act + sum.energy_act;

  return {
    ...sum,
    totalRevAct,
    totalRevBud,
    totalExpAct,
    occAct: sum.avail_act > 0 ? (sum.sold_act / sum.avail_act) * 100 : 0,
    occBud: sum.avail_bud > 0 ? (sum.sold_bud / sum.avail_bud) * 100 : 0,
    adrAct: sum.sold_act > 0 ? sum.rev_room_act / sum.sold_act : 0,
    adrBud: sum.sold_bud > 0 ? sum.rev_room_bud / sum.sold_bud : 0,
    revparAct: sum.avail_act > 0 ? sum.rev_room_act / sum.avail_act : 0,
    revparBud: sum.avail_bud > 0 ? sum.rev_room_bud / sum.avail_bud : 0,
    fbCostRatio:
      sum.rev_fb_act > 0 ? (sum.cost_fb_act / sum.rev_fb_act) * 100 : 0,
  };
}

function extractVal(data: any, dept: string, isBudget: boolean): number {
  const t = isBudget ? "bud" : "act";
  switch (dept) {
    case "TOTAL_REVENUE":
      return isBudget ? data.totalRevBud : data.totalRevAct;
    case "ROOM":
      return data[`rev_room_${t}`];
    case "FB":
      return data[`rev_fb_${t}`];
    case "MEETING":
      return data[`rev_meet_${t}`];
    case "OTHERS":
      return data[`rev_oth_${t}`];
    case "COST_FB":
      return data[`cost_fb_${t}`];
    case "PAYROLL":
      return data[`payroll_${t}`];
    case "OTHER_EXP":
      return data[`other_exp_${t}`];
    case "ENERGY":
      return data[`energy_${t}`];
    case "NON_OP":
      return data[`non_op_${t}`];
    case "GOP":
      return data[`gop_${t}`];
    case "STAT_OCC":
      return isBudget ? data.avail_bud : data.sold_act;
    case "STAT_ADR":
      return isBudget ? data.adrBud : data.adrAct;
    case "STAT_REVPAR":
      return isBudget ? data.revparBud : data.revparAct;
    case "STAT_PAX":
      return data[`pax_${t}`];
    default:
      return 0;
  }
}

const formatRp = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num || 0));
const formatNum = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num || 0));

export default function Dashboard() {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0 = Jan, 11 = Des
// Bulan sebelumnya (jika Januari, mundur ke Desember tahun lalu)
  const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const prevMonthYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
  const prevMonth = String(prevMonthIndex + 1).padStart(2, '0');

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
  const [compareYear, setCompareYear] = useState<string>("2024");
  const [activeDept, setActiveDept] = useState<string>("TOTAL_REVENUE");
  const [showBudget, setShowBudget] = useState<boolean>(true);

  const [dbData, setDbData] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(true);

  useEffect(() => {
    async function initDashboardAuth() {
      const role = localStorage.getItem("userRole");
      const savedPropId = localStorage.getItem("propertyId");

      if (!role) {
        router.push("/login");
        return;
      }

      setUserRole(role);

      if (role === "super_admin") {
        const { data: props } = await supabase
          .from("properties")
          .select("*")
          .order("name");
        setPropList(props || []);
        if (props && props.length > 0) {
          setActivePropId(props[0].id);
          setActivePropName(props[0].name);
          setActivePropLogo(props[0].logo_url || "");
        }
      } else {
        const { data: currentProp } = await supabase
          .from("properties")
          .select("*")
          .eq("id", savedPropId)
          .single();
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
      const { data, error } = await supabase
        .from("hotel_finance_reports")
        .select("*")
        .eq("property_id", activePropId);

      if (error) console.error("DB Fetch Error:", error);
      else setDbData(data || []);
      setIsLoadingDB(false);
    }
    fetchLedgerData();
  }, [selectedYear, compareYear, compareMode, activePropId, isAuthChecking]);

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

  const lblDept: Record<string, string> = {
    TOTAL_REVENUE: "Total Revenue",
    ROOM: "Room Revenue",
    FB: "F&B Revenue",
    MEETING: "Meeting Revenue",
    OTHERS: "Other Revenue",
    COST_FB: "Cost of F&B",
    PAYROLL: "Payroll",
    OTHER_EXP: "Other Expenses",
    ENERGY: "Energy Cost",
    NON_OP: "Non Operating",
    GOP: "Gross Operating Profit",
    STAT_OCC: "Occupancy & Room Sold",
    STAT_ADR: "ADR (Avg Daily Rate)",
    STAT_REVPAR: "RevPAR",
    STAT_PAX: "Total Guest (Pax)",
  };

  const isRpFormat = !["STAT_OCC", "STAT_PAX"].includes(activeDept);
  const isCostOrGop = [
    "COST_FB",
    "PAYROLL",
    "OTHER_EXP",
    "ENERGY",
    "NON_OP",
    "GOP",
  ].includes(activeDept);
  const isStat = activeDept.startsWith("STAT_");
  const PIE_COLORS = ["#ffc107", "#10b981"];

  const renderDashboardPanel = (yearStr: string, isCompact: boolean) => {
    const data = getAggregatedData(
      yearStr,
      selectedMonth,
      isYTD,
      dbData,
      activePropId
    );

    const actualValue = extractVal(data, activeDept, false);
    const budgetValue = extractVal(data, activeDept, true);
    const variance = actualValue - budgetValue;

    const barChartData = (() => {
      if (activeDept === "TOTAL_REVENUE") {
        if (isYTD) {
          return monthsList.map((m) => {
            const mData = getAggregatedData(
              yearStr,
              m.value,
              false,
              dbData,
              activePropId
            );
            return {
              name: m.label.substring(0, 3),
              Room: mData.rev_room_act || 0,
              "F&B": mData.rev_fb_act || 0,
              Meet: mData.rev_meet_act || 0,
              Others: mData.rev_oth_act || 0,
            };
          });
        } else {
          return [
            {
              name: "Room",
              Actual: data.rev_room_act,
              Target: data.rev_room_bud,
            },
            {
              name: "F&B",
              Actual: data.rev_fb_act,
              Target: data.rev_fb_bud,
            },
            {
              name: "Meet",
              Actual: data.rev_meet_act,
              Target: data.rev_meet_bud,
            },
            {
              name: "Oth",
              Actual: data.rev_oth_act,
              Target: data.rev_oth_bud,
            },
          ];
        }
      }

      if (!isYTD) {
        const monthLabel =
          monthsList.find((m) => m.value === selectedMonth)?.label || "";
        return [
          {
            name: monthLabel.substring(0, 3),
            Actual: actualValue || 0,
            Target: budgetValue || 0,
          },
        ];
      }

      return monthsList.map((m) => {
        const mData = getAggregatedData(
          yearStr,
          m.value,
          false,
          dbData,
          activePropId
        );
        return {
          name: m.label.substring(0, 3),
          Actual: extractVal(mData, activeDept, false) || 0,
          Target: extractVal(mData, activeDept, true) || 0,
        };
      });
    })();

    const pieChartData = isCostOrGop
      ? [
          {
            name: activeDept === "GOP" ? "GOP" : "Cost",
            value: actualValue,
          },
          {
            name: activeDept === "GOP" ? "Total Expense" : "Revenue",
            value: Math.max(0, data.totalRevAct - actualValue),
          },
        ]
      : [];

    const renderCustomizedLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
    }: any) => {
      if (data.totalRevAct <= 0 || value <= 0) return null;
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const percent = ((value / data.totalRevAct) * 100).toFixed(0);
      return (
        <text
          x={cx + radius * Math.cos(-midAngle * RADIAN)}
          y={cy + radius * Math.sin(-midAngle * RADIAN)}
          fill="#1e293b"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: isCompact ? "10px" : "12px",
            fontWeight: "900",
            textShadow: "0px 1px 2px rgba(255,255,255,0.5)",
          }}
        >
          {percent}%
        </text>
      );
    };

    const dynamicBarSize =
      (!isYTD || activeDept !== "TOTAL_REVENUE") && barChartData.length <= 2
        ? 30
        : undefined;

    return (
      <div
        className={`flex ${
          isCompact ? "flex-col" : "flex-col md:flex-row"
        } gap-4 2xl:gap-6`}
      >
        {/* Panel analisis kiri - LENGKAP */}
        <div
          className={`w-full ${
            isCompact ? "" : "md:w-1/3"
          } flex flex-col space-y-3 bg-white p-3 2xl:p-5 border border-slate-200 rounded-lg shadow-sm overflow-y-auto`}
        >
          <div className="border-b border-slate-200 pb-1.5 mb-1">
            <p className="text-[10px] 2xl:text-xs font-black text-sky-800 uppercase">
              PERFORMA {yearStr}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 2xl:gap-4">
            <div>
              <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-0.5">
                Actual Result
              </p>
              <p
                className={`${
                  isCompact ? "text-sm" : "text-base 2xl:text-lg"
                } font-bold text-slate-950 truncate`}
              >
                {isRpFormat ? formatRp(actualValue) : formatNum(actualValue)}
              </p>
            </div>
            <div>
              <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-0.5">
                {activeDept === "STAT_OCC" ? "Target (Avail)" : "Budget Target"}
              </p>
              <p
                className={`${
                  isCompact ? "text-xs" : "text-sm 2xl:text-md"
                } font-bold text-slate-600 truncate`}
              >
                {isRpFormat ? formatRp(budgetValue) : formatNum(budgetValue)}
              </p>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 p-2 2xl:p-3 rounded-lg shadow-inner">
            <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-0.5 tracking-tight">
              Variance (Act vs Bud)
            </p>
            <p
              className={`text-sm 2xl:text-lg font-bold truncate ${
                variance >= 0
                  ? isCostOrGop && activeDept !== "GOP"
                    ? "text-red-600"
                    : "text-emerald-600"
                  : isCostOrGop && activeDept !== "GOP"
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {variance >= 0 ? "+" : ""}
              {isRpFormat ? formatRp(variance) : formatNum(variance)}
            </p>
          </div>

          {/* RATIO UNTUK COST & GOP */}
          {isCostOrGop && (
            <div className="pt-1.5 2xl:pt-2 border-t border-slate-200 mt-1">
              <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-1">
                Ratio to Total Revenue
              </p>
              <div className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                <table className="w-full text-[9px] 2xl:text-[10px] font-bold">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1 2xl:py-1.5 px-2 text-slate-500 bg-slate-200/60">
                        Total Revenue
                      </td>
                      <td className="py-1 2xl:py-1.5 px-2 text-right text-slate-800 bg-slate-200/60">
                        {formatRp(data.totalRevAct)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 2xl:py-1.5 px-2 text-slate-500">
                        {activeDept === "GOP" ? "GOP" : "Cost"}
                      </td>
                      <td className="py-1 2xl:py-1.5 px-2 text-right text-slate-900">
                        {formatRp(actualValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DETAIL REVENUE BREAKDOWN & EFFICIENCY RATIO */}
          {!isStat && !isCostOrGop && activeDept === "TOTAL_REVENUE" && (
            <>
              <div className="pt-2 border-t border-slate-200 space-y-1 mt-1">
                <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-1">
                  Revenue Breakdown
                </p>
                {[
                  { lbl: "Room", act: data.rev_room_act },
                  { lbl: "F&B", act: data.rev_fb_act },
                  { lbl: "Meeting", act: data.rev_meet_act },
                  { lbl: "Others", act: data.rev_oth_act },
                ].map((item, idx) => {
                  const pct =
                    data.totalRevAct > 0
                      ? (item.act / data.totalRevAct) * 100
                      : 0;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-b border-slate-100 pb-1"
                    >
                      <span className="text-slate-600 text-[9px] 2xl:text-[10px] truncate max-w-[60px] 2xl:max-w-none">
                        {item.lbl}
                      </span>
                      <div className="text-right flex items-center shrink-0">
                        <span className="text-slate-800 text-[9px] 2xl:text-[10px] font-bold">
                          {formatRp(item.act)}
                        </span>
                        <span className="text-sky-700 text-[9px] 2xl:text-[10px] ml-2 font-black w-8 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 mt-2">
                <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-1">
                  Efficiency Ratio (Rev vs Cost)
                </p>
                <div className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                  <table className="w-full text-[9px] 2xl:text-[10px] font-bold">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 2xl:py-1.5 px-2 text-slate-500 bg-emerald-50">
                          Total Revenue
                        </td>
                        <td className="py-1 2xl:py-1.5 px-2 text-right text-emerald-800 bg-emerald-50">
                          {formatRp(data.totalRevAct)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 2xl:py-1.5 px-2 text-slate-500 bg-red-50">
                          Total Expense
                        </td>
                        <td className="py-1 2xl:py-1.5 px-2 text-right text-red-800 bg-red-50">
                          {formatRp(data.totalExpAct)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 2xl:py-1.5 px-2 text-slate-800 font-black">
                          GOP Margin
                        </td>
                        <td className="py-1 2xl:py-1.5 px-2 text-right text-slate-900 flex justify-end items-center gap-2">
                          <span>{formatRp(data.gop_act)}</span>
                          <span className="text-sky-700 font-black w-8 text-right">
                            {data.totalRevAct > 0
                              ? ((data.gop_act / data.totalRevAct) * 100).toFixed(1)
                              : 0}
                            %
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {isStat && (
            <div className="pt-2 border-t border-slate-200 mt-1 space-y-1.5">
              <p className="text-[8px] 2xl:text-[9px] text-slate-500 font-bold uppercase mb-1">
                Statistic Summary
              </p>
              {[
                { lbl: "ADR", val: formatRp(data.adrAct) },
                { lbl: "RevPAR", val: formatRp(data.revparAct) },
                { lbl: "Occupancy", val: `${data.occAct.toFixed(1)}%` },
                { lbl: "Room Sold", val: formatNum(data.sold_act) },
                { lbl: "Total Guest", val: formatNum(data.pax_act) },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-slate-100 pb-1"
                >
                  <span className="text-slate-600 text-[9px] 2xl:text-[10px]">
                    {s.lbl}
                  </span>
                  <span className="text-slate-800 font-bold text-[9px] 2xl:text-[10px]">
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel grafik kanan */}
        <div
          className={`w-full ${
            isCompact
              ? "h-[200px] lg:h-[220px] 2xl:h-[300px]"
              : "md:w-2/3 border-l border-slate-200 pl-4 2xl:pl-6 h-[220px] lg:h-[250px] 2xl:h-[360px]"
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {isCostOrGop ? (
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isCompact ? 70 : 100}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatRp(Number(value))}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: "#1e293b",
                  }}
                />
              </PieChart>
            ) : (
              <BarChart
                data={barChartData as any[]}
                margin={{ top: 0, right: 0, left: -15, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    !isRpFormat
                      ? formatNum(v as number)
                      : `Rp${((v as number) / 1000000).toFixed(0)}M`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(v: any) =>
                    !isRpFormat ? formatNum(Number(v)) : formatRp(Number(v))
                  }
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                />
                <Legend
                  iconType="plainline"
                  wrapperStyle={{
                    fontSize: "9px",
                    paddingTop: "10px",
                    color: "#1e293b",
                  }}
                />

                {activeDept === "TOTAL_REVENUE" && isYTD ? (
                  <>
                    <Bar
                      dataKey="Room"
                      name="Room"
                      fill="#0ea5e9"
                      barSize={10}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="F&B"
                      name="F&B"
                      fill="#f59e0b"
                      barSize={10}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Meet"
                      name="Meeting"
                      fill="#10b981"
                      barSize={10}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Others"
                      name="Others"
                      fill="#8b5cf6"
                      barSize={10}
                      radius={[2, 2, 0, 0]}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey="Actual"
                      name={`Actual ${yearStr}`}
                      fill="#0ea5e9"
                      barSize={dynamicBarSize}
                      maxBarSize={30}
                      radius={[2, 2, 0, 0]}
                    />
                    {showBudget && (
                      <Bar
                        dataKey="Target"
                        name={`Budget ${yearStr}`}
                        fill="#cbd5e1"
                        barSize={dynamicBarSize}
                        maxBarSize={30}
                        radius={[2, 2, 0, 0]}
                      />
                    )}
                  </>
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const mainStats = useMemo(
    () =>
      getAggregatedData(
        selectedYear,
        selectedMonth,
        isYTD,
        dbData,
        activePropId
      ),
    [selectedYear, selectedMonth, isYTD, dbData, activePropId]
  );

  if (isAuthChecking)
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs">
        Menyambungkan ke Node Hotel...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 lg:p-4 2xl:p-6 font-mono text-xs">
      {/* TOP NAV BAR */}
      <div className="flex justify-end gap-2 mb-3 2xl:mb-4">
        <button
          onClick={() => router.push("/input")}
          className="flex items-center gap-1.5 px-2 py-1 2xl:px-3 2xl:py-1.5 bg-white border border-slate-200 rounded text-[9px] 2xl:text-[10px] font-black text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-all uppercase shadow-sm"
        >
          <Edit3 size={10} /> Input Data
        </button>
        {userRole === "super_admin" && (
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-1.5 px-2 py-1 2xl:px-3 2xl:py-1.5 bg-white border border-slate-200 rounded text-[9px] 2xl:text-[10px] font-black text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all uppercase shadow-sm"
          >
            <Settings size={10} /> Control Tower
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2 py-1 2xl:px-3 2xl:py-1.5 bg-white border border-slate-200 rounded text-[9px] 2xl:text-[10px] font-black text-slate-600 hover:text-red-700 hover:bg-red-50 transition-all uppercase shadow-sm"
        >
          <LogOut size={10} /> Logout
        </button>
      </div>

      {/* HEADER LOGO & SELECTOR */}
      <div className="mb-4 2xl:mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-200 pb-3 2xl:pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 2xl:w-12 2xl:h-12 bg-white border border-slate-200 rounded shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1">
            {activePropLogo ? (
              <img
                src={activePropLogo}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="bg-slate-900 text-white w-full h-full flex items-center justify-center rounded-sm">
                <LayoutGrid size={16} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-base 2xl:text-xl font-black text-slate-900 uppercase tracking-tight">
              {activePropName}
            </h1>
            <p className="text-[8px] 2xl:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Multi-Tenant Portal v9.6
            </p>
          </div>
        </div>

        <div className="flex flex-wrap bg-white border border-slate-200 p-1 rounded items-center gap-1.5 shadow-sm">
          {userRole === "super_admin" && (
            <>
              <select
                value={activePropId}
                onChange={handlePropChange}
                className="bg-sky-50 text-sky-800 font-black border-none text-[10px] 2xl:text-xs focus:outline-none cursor-pointer px-2 py-1 rounded uppercase"
              >
                {propList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="w-px h-4 bg-slate-200"></div>
            </>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent font-black text-[10px] 2xl:text-xs px-1 cursor-pointer"
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-black text-[10px] 2xl:text-xs px-1 cursor-pointer"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
            <button
              onClick={() => setIsYTD(false)}
              className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${
                !isYTD
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Mth
            </button>
            <button
              onClick={() => setIsYTD(true)}
              className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${
                isYTD
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              YTD
            </button>
          </div>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200">
            <button
              onClick={() => setCompareMode("BUDGET")}
              className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${
                compareMode === "BUDGET"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500"
              }`}
            >
              vs Bud
            </button>
            <button
              onClick={() => setCompareMode("YOY")}
              className={`px-2 py-1 rounded-sm text-[9px] 2xl:text-[10px] font-black uppercase transition-all ${
                compareMode === "YOY"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500"
              }`}
            >
              vs YoY
            </button>
            {compareMode === "YOY" && (
              <select
                value={compareYear}
                onChange={(e) => setCompareYear(e.target.value)}
                className="ml-1 bg-white text-indigo-700 font-black rounded-sm text-[9px] 2xl:text-[10px] p-0.5 border border-indigo-200"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {isLoadingDB && (
        <div className="flex items-center justify-center bg-amber-50 p-2 mb-4 rounded border border-amber-200 text-amber-700 font-bold animate-pulse text-[10px]">
          <Database size={12} className="mr-2" /> Menarik Ledger Data...
        </div>
      )}

      {/* KPI CARDS */}
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-2 2xl:gap-4 mb-4 2xl:mb-6 transition-opacity duration-300 ${
          isLoadingDB ? "opacity-30" : "opacity-100"
        }`}
      >
        <div className="bg-white border-l-4 border-l-sky-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200">
          <p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1">
            <Briefcase size={8} /> GOP
          </p>
          <p className="text-sm 2xl:text-lg font-black text-slate-900">
            {formatRp(mainStats.gop_act)}
          </p>
        </div>
        <div className="bg-white border-l-4 border-l-emerald-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200">
          <p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1">
            <Users size={8} /> OCCUPANCY
          </p>
          <p className="text-sm 2xl:text-lg font-black text-slate-900">
            {mainStats.occAct.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white border-l-4 border-l-indigo-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200">
          <p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1">
            <Activity size={8} /> REVPAR
          </p>
          <p className="text-sm 2xl:text-lg font-black text-slate-900">
            {formatRp(mainStats.revparAct)}
          </p>
        </div>
        <div className="bg-white border-l-4 border-l-red-600 p-2.5 2xl:p-4 rounded shadow-sm border border-slate-200">
          <p className="flex items-center gap-1 text-slate-500 font-black uppercase text-[8px] 2xl:text-[9px] mb-1">
            <Percent size={8} /> F&B COST
          </p>
          <p
            className={`text-sm 2xl:text-lg font-black ${
              mainStats.fbCostRatio > 32 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {mainStats.fbCostRatio.toFixed(1)}%
          </p>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-4 2xl:gap-8 transition-opacity duration-300 ${
          isLoadingDB ? "opacity-30 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* SIDEBAR MENU */}
        <div className="lg:col-span-2 space-y-2 border-r border-slate-200 pr-2 2xl:pr-4">
          <p className="text-[9px] 2xl:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1.5 mb-2 2xl:mb-4">
            Menu Index
          </p>

          <ul className="space-y-1">
            {indexMenuRev.map((item) => (
              <li
                key={item.id}
                onClick={() => setActiveDept(item.id)}
                className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${
                  activeDept === item.id
                    ? "bg-sky-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </li>
            ))}
          </ul>

          <div className="my-2 2xl:my-3 border-t-2 border-dashed border-slate-200"></div>

          <ul className="space-y-1">
            {indexMenuCost.map((item) => (
              <li
                key={item.id}
                onClick={() => setActiveDept(item.id)}
                className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${
                  activeDept === item.id
                    ? "bg-sky-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </li>
            ))}
          </ul>

          <div className="my-2 2xl:my-3 border-t-2 border-dashed border-slate-200"></div>

          <ul className="space-y-1">
            {indexMenuGop.map((item) => (
              <li
                key={item.id}
                onClick={() => setActiveDept(item.id)}
                className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${
                  activeDept === item.id
                    ? "bg-sky-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </li>
            ))}
          </ul>

          <div className="my-2 2xl:my-3 border-t-2 border-dashed border-slate-200"></div>

          <ul className="space-y-1">
            {indexMenuStat.map((item) => (
              <li
                key={item.id}
                onClick={() => setActiveDept(item.id)}
                className={`text-[9px] 2xl:text-[11px] font-black cursor-pointer px-2 py-1.5 2xl:px-3 2xl:py-2 rounded transition-all ${
                  activeDept === item.id
                    ? "bg-sky-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* WORKSPACE */}
        <div className="lg:col-span-10">
          <div className="flex justify-between items-center mb-3 2xl:mb-5 border-b border-slate-200 pb-2">
            <span className="text-[11px] 2xl:text-[14px] font-black text-slate-800 uppercase">
              {lblDept[activeDept]} Analysis
            </span>
            {!isCostOrGop && (
              <button
                onClick={() => setShowBudget(!showBudget)}
                className="text-[8px] 2xl:text-[10px] font-black uppercase text-sky-700 bg-sky-50 px-2 py-1 2xl:px-3 2xl:py-1.5 rounded border border-sky-100"
              >
                {showBudget ? "Hide Budget Target" : "Show Budget Target"}
              </button>
            )}
          </div>

          {compareMode === "BUDGET" ? (
            <div className="w-full bg-white/50 p-3 2xl:p-6 rounded-lg 2xl:rounded-2xl border border-slate-200 shadow-sm">
              {renderDashboardPanel(selectedYear, false)}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-8 w-full">
              <div className="bg-white p-3 2xl:p-6 rounded-lg 2xl:rounded-2xl border border-slate-200 shadow-sm">
                {renderDashboardPanel(selectedYear, true)}
              </div>
              <div className="bg-white p-3 2xl:p-6 rounded-lg 2xl:rounded-2xl border border-slate-200 shadow-sm">
                {renderDashboardPanel(compareYear, true)}
              </div>
            </div>
          )}

          <div className="mt-6 2xl:mt-10 pt-4 border-t border-slate-200 flex justify-between items-center opacity-60">
            <p className="font-bold text-[8px] 2xl:text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={10} /> Secure Tenant
            </p>
            <button className="flex items-center gap-1.5 bg-slate-900 text-white font-black px-4 py-2 2xl:px-6 2xl:py-3 rounded hover:bg-sky-700 transition-all uppercase tracking-widest text-[8px] 2xl:text-[10px] shadow-md">
              <FileText size={12} /> Export Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}