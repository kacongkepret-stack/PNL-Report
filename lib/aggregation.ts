// lib/aggregation.ts
export const monthsList = [
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

export const yearsList: string[] = ["2025", "2026", "2027"];

export function getAggregatedData(
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

  let sum: any = {
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
    rev_spa_act: 0, // <-- Integrasi SPA Actual
    rev_spa_bud: 0, // <-- Integrasi SPA Budget
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
    sum.rev_spa_act += Number(r.rev_spa_actual || 0); // <-- Mapping DB field
    sum.rev_spa_bud += Number(r.rev_spa_budget || 0); // <-- Mapping DB field
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

  // Rumus kalkulasi Total Revenue diperbarui dengan menyertakan SPA
  const totalRevAct = sum.rev_room_act + sum.rev_fb_act + sum.rev_meet_act + sum.rev_spa_act + sum.rev_oth_act;
  const totalRevBud = sum.rev_room_bud + sum.rev_fb_bud + sum.rev_meet_bud + sum.rev_spa_bud + sum.rev_oth_bud;

  return {
    ...sum,
    totalRevAct,
    totalRevBud,
    totalExpAct: sum.cost_fb_act + sum.payroll_act + sum.other_exp_act + sum.energy_act,
    occAct: sum.avail_act > 0 ? (sum.sold_act / sum.avail_act) * 100 : 0,
    occBud: sum.avail_bud > 0 ? (sum.sold_bud / sum.avail_bud) * 100 : 0,
    adrAct: sum.sold_act > 0 ? sum.rev_room_act / sum.sold_act : 0,
    adrBud: sum.sold_bud > 0 ? sum.rev_room_bud / sum.sold_bud : 0,
    revparAct: sum.avail_act > 0 ? sum.rev_room_act / sum.avail_act : 0,
    revparBud: sum.avail_bud > 0 ? sum.rev_room_bud / sum.avail_bud : 0,
    fbCostRatio: sum.rev_fb_act > 0 ? (sum.cost_fb_act / sum.rev_fb_act) * 100 : 0,
  };
}

export function extractVal(data: any, dept: string, isBudget: boolean): number {
  const t = isBudget ? "bud" : "act";
  switch (dept) {
    case "TOTAL_REVENUE": return isBudget ? data.totalRevBud : data.totalRevAct;
    case "ROOM": return data[`rev_room_${t}`];
    case "FB": return data[`rev_fb_${t}`];
    case "MEETING": return data[`rev_meet_${t}`];
    case "SPA": return data[`rev_spa_${t}`]; // <-- Ekstraksi Nilai SPA
    case "OTHERS": return data[`rev_oth_${t}`];
    case "COST_FB": return data[`cost_fb_${t}`];
    case "PAYROLL": return data[`payroll_${t}`];
    case "OTHER_EXP": return data[`other_exp_${t}`];
    case "ENERGY": return data[`energy_${t}`];
    case "NON_OP": return data[`non_op_${t}`];
    case "GOP": return data[`gop_${t}`];
    case "STAT_OCC": return isBudget ? data.sold_bud : data.sold_act;   
    case "STAT_ADR": return isBudget ? data.adrBud : data.adrAct;
    case "STAT_REVPAR": return isBudget ? data.revparBud : data.revparAct;
    case "STAT_PAX": return data[`pax_${t}`];
    default: return 0;
  }
}

export const formatRp = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num || 0));

export const formatNum = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num || 0));