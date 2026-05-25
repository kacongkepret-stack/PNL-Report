"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  getAggregatedData, extractVal, formatRp, formatNum, monthsList,
} from "@/lib/aggregation";

interface ExportChartPanelProps {
  data: any;
  deptId: string;
  yearStr: string;
  month: string;
  isYTD: boolean;
  dbData: any[];
  activePropId: string;
  height?: number;
}

const PIE_COLORS = ["#f97316", "#0ea5e9"];

const ExportChartPanel: React.FC<ExportChartPanelProps> = ({
  data,
  deptId,
  yearStr,
  month,
  isYTD,
  dbData,
  activePropId,
  height = 420,
}) => {
  const actualValue = extractVal(data, deptId, false);
  const budgetValue = extractVal(data, deptId, true);
  const variance = actualValue - budgetValue;
  const achPercent = budgetValue > 0 ? ((actualValue / budgetValue) * 100).toFixed(1) : "N/A";

  const isRpFormat = !["STAT_OCC", "STAT_PAX"].includes(deptId);
  const isCostOrGop = ["COST_FB", "PAYROLL", "OTHER_EXP", "ENERGY", "NON_OP", "GOP"].includes(deptId);
  const monthsToShow = isYTD ? monthsList.slice(0, parseInt(month)) : monthsList;

  const PANEL_WIDTH = 760;
  const CHART_WIDTH = 500; 
  const CHART_HEIGHT = height - 120; 

  let barChartData: any[] = [];
  if (deptId === "TOTAL_REVENUE") {
    if (isYTD) {
      barChartData = monthsToShow.map((m) => {
        const mData = getAggregatedData(yearStr, m.value, false, dbData, activePropId);
        return {
          name: m.label.substring(0, 3),
          Room: mData.rev_room_act || 0,
          "F&B": mData.rev_fb_act || 0,
          Meet: mData.rev_meet_act || 0,
          Spa: mData.rev_spa_act || 0,
          Others: mData.rev_oth_act || 0,
        };
      });
    } else {
      barChartData = [
        { name: "Room", Actual: data.rev_room_act || 0, Target: data.rev_room_bud || 0 },
        { name: "F&B", Actual: data.rev_fb_act || 0, Target: data.rev_fb_bud || 0 },
        { name: "Meet", Actual: data.rev_meet_act || 0, Target: data.rev_meet_bud || 0, hide: !(data.rev_meet_act > 0 || data.rev_meet_bud > 0) },
        { name: "Spa", Actual: data.rev_spa_act || 0, Target: data.rev_spa_bud || 0, hide: !(data.rev_spa_act > 0 || data.rev_spa_bud > 0) },
        { name: "Oth", Actual: data.rev_oth_act || 0, Target: data.rev_oth_bud || 0 },
      ].filter(d => !d.hide);
    }
  } else if (!isYTD) {
    const monthLabel = monthsList.find((m) => m.value === month)?.label || "";
    barChartData = [{ name: monthLabel.substring(0, 3), Actual: actualValue, Target: budgetValue }];
  } else {
    barChartData = monthsToShow.map((m) => {
      const mData = getAggregatedData(yearStr, m.value, false, dbData, activePropId);
      return { name: m.label.substring(0, 3), Actual: extractVal(mData, deptId, false), Target: extractVal(mData, deptId, true) };
    });
  }

  let pieChartData: { name: string; value: number }[] = [];
  if (isCostOrGop) {
    const costValue = actualValue; 
    const totalRevenue = data.totalRevAct || 0;
    if (deptId === "GOP") {
      const totalExpense = data.totalExpAct || 0;
      pieChartData = [
        { name: "GOP", value: costValue },
        { name: "Total Expense", value: Math.max(0, totalExpense) },
      ];
    } else {
      pieChartData = [
        { name: deptId.replace(/_/g, " "), value: costValue },
        { name: "Remaining Revenue", value: Math.max(0, totalRevenue - costValue) },
      ];
    }
  }

  const renderPieChart = () => {
    if (pieChartData.length === 0 || pieChartData.every((d) => d.value <= 0)) {
      return (
        <div style={{ width: `${CHART_WIDTH}px`, height: `${CHART_HEIGHT}px`, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "12px", border: "1px dashed #cbd5e1" }}>
          No data available for distribution
        </div>
      );
    }
    return (
      <PieChart width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Pie 
          data={pieChartData} 
          cx="50%" 
          cy="50%" 
          innerRadius={60} 
          outerRadius={100} 
          dataKey="value" 
          labelLine={false} 
          isAnimationActive={false} 
          // FIX TYPESCRIPT ERROR: Bypass tipe data ketat dan berikan nilai default = 0
          label={(props: any) => {
            const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            return (
              <text 
                x={cx + radius * Math.cos(-midAngle * RADIAN)} 
                y={cy + radius * Math.sin(-midAngle * RADIAN)} 
                fill="#ffffff" 
                textAnchor="middle" 
                dominantBaseline="central" 
                style={{ fontSize: "14px", fontWeight: "bold" }}
              >
                {(percent * 100).toFixed(0)}%
              </text>
            );
          }}>
          {pieChartData.map((entry, index) => (<Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={3} />))}
        </Pie>
        <Tooltip formatter={(v: any) => formatRp(Number(v))} />
        <Legend verticalAlign="bottom" height={30} iconType="square" wrapperStyle={{ fontSize: "11px", fontWeight: "bold", color: "#334155" }} />
      </PieChart>
    );
  };

  const monthLabel = monthsList.find((m) => m.value === month)?.label || "";
  const periodeText = isYTD ? `YTD JAN - ${monthLabel.toUpperCase()} ${yearStr}` : `${monthLabel.toUpperCase()} ${yearStr}`;
  const isGood = variance >= 0 ? (isCostOrGop && deptId !== "GOP" ? false : true) : (isCostOrGop && deptId !== "GOP" ? true : false);
  const colorKPI = isGood ? "#059669" : "#dc2626";
  const signVar = variance >= 0 ? "+" : "";

  return (
    <div style={{ width: `${PANEL_WIDTH}px`, height: `${height}px`, padding: "20px", background: "#ffffff", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", border: "1px solid #cbd5e1", borderTop: "6px solid #0f172a", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "15px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{deptId.replace(/_/g, " ")}</h2>
          <p style={{ fontSize: "10px", color: "#64748b", margin: "4px 0 0 0", fontWeight: "bold", letterSpacing: "0.5px" }}>EXECUTIVE ANALYSIS | {periodeText}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "10px", color: "#64748b", margin: 0, fontWeight: "bold" }}>% TARGET ACHIEVED</p>
          <h3 style={{ fontSize: "22px", fontWeight: "900", color: colorKPI, margin: 0 }}>{achPercent !== "N/A" ? `${achPercent}%` : "N/A"}</h3>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", flex: 1 }}>
        <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "12px", borderLeft: "4px solid #0ea5e9" }}>
            <p style={{ fontSize: "9px", color: "#64748b", fontWeight: "bold", margin: "0 0 4px 0", textTransform: "uppercase" }}>Actual</p>
            <p style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", margin: 0 }}>{isRpFormat ? formatRp(actualValue) : formatNum(actualValue)}</p>
          </div>
          <div style={{ background: "#f8fafc", padding: "12px", borderLeft: "4px solid #94a3b8" }}>
            <p style={{ fontSize: "9px", color: "#64748b", fontWeight: "bold", margin: "0 0 4px 0", textTransform: "uppercase" }}>Budget</p>
            <p style={{ fontSize: "14px", fontWeight: "bold", color: "#475569", margin: 0 }}>{isRpFormat ? formatRp(budgetValue) : formatNum(budgetValue)}</p>
          </div>
          <div style={{ background: isGood ? "#ecfdf5" : "#fef2f2", padding: "12px", borderLeft: `4px solid ${colorKPI}` }}>
            <p style={{ fontSize: "9px", color: colorKPI, fontWeight: "bold", margin: "0 0 4px 0", textTransform: "uppercase" }}>Variance</p>
            <p style={{ fontSize: "14px", fontWeight: "900", color: colorKPI, margin: 0 }}>{signVar}{isRpFormat ? formatRp(variance) : formatNum(variance)}</p>
          </div>

          {deptId === "TOTAL_REVENUE" && (
            <div style={{ marginTop: "auto", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}><span style={{ color: "#64748b" }}>Room</span><span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRp(data.rev_room_act)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}><span style={{ color: "#64748b" }}>F&B</span><span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRp(data.rev_fb_act)}</span></div>
              {(data.rev_meet_act > 0 || data.rev_meet_bud > 0) && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}><span style={{ color: "#64748b" }}>Meeting</span><span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRp(data.rev_meet_act)}</span></div>}
              {(data.rev_spa_act > 0 || data.rev_spa_bud > 0) && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}><span style={{ color: "#64748b" }}>Spa</span><span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRp(data.rev_spa_act)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}><span style={{ color: "#64748b" }}>Other</span><span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRp(data.rev_oth_act)}</span></div>
            </div>
          )}

          {deptId === "GOP" && (
             <div style={{ marginTop: "auto", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}><span style={{ color: "#64748b" }}>Total Rev</span><span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRp(data.totalRevAct)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}><span style={{ color: "#64748b" }}>Total Exp</span><span style={{ fontWeight: "bold", color: "#dc2626" }}>{formatRp(data.totalExpAct)}</span></div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isCostOrGop ? (
            renderPieChart()
          ) : (
            <BarChart width={CHART_WIDTH} height={CHART_HEIGHT} data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => isRpFormat ? `Rp${(v / 1000000).toFixed(0)}M` : formatNum(v)} width={65} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(v: any) => (isRpFormat ? formatRp(Number(v)) : formatNum(Number(v)))} contentStyle={{ fontSize: "11px", fontWeight: "bold", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
              <Legend iconType="square" wrapperStyle={{ fontSize: "11px", fontWeight: "bold", paddingTop: "10px", color: "#334155" }} />
              
              {deptId === "TOTAL_REVENUE" && isYTD ? (
                <>
                  <Bar dataKey="Room" name="Room" fill="#0ea5e9" barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="F&B" name="F&B" fill="#f59e0b" barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  {(data.rev_meet_act > 0 || data.rev_meet_bud > 0) && <Bar dataKey="Meet" name="Meet" fill="#10b981" barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />}
                  {(data.rev_spa_act > 0 || data.rev_spa_bud > 0) && <Bar dataKey="Spa" name="Spa" fill="#ec4899" barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />}
                  <Bar dataKey="Others" name="Oth" fill="#8b5cf6" barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </>
              ) : (
                <>
                  <Bar dataKey="Actual" name="Actual" fill="#0f172a" barSize={24} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Target" name="Budget" fill="#cbd5e1" barSize={24} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </>
              )}
            </BarChart>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportChartPanel;