import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/Card";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Label } from "./components/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/Tabs";
import { Switch } from "./components/Switch";
import { Separator } from "./components/Separator";
import { Field } from './components/Field';
import { Stat } from './components/Stat';
import type { CalculatorInputs } from './types';
import { PiggyBank, Percent, DollarSign, BarChart3, Calculator, Download, RefreshCw } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, BarChart, Bar } from "recharts";
import * as XLSX from 'xlsx';

const INITIAL_STATE: CalculatorInputs = {
  price: 25,
  monthlyUnits: 300,
  cogs: 6,
  inbound: 1.5,
  prep: 0.2,
  otherUnit: 0.3,
  tariff: 0,
  saleTaxPct: 0,
  referralPct: 15,
  fulfillmentFee: 4.5,
  closingFee: 0,
  storagePerUnit: 0.2,
  acosPct: 10,
  fixedMonthly: 250,
  sellingPlan: 39.99,
  initialUnits: 500,
  totalInvestment: 5000,
  loanAmount: 4000,
  rateMode: "annual",
  aprPct: 18,
  monthlyRatePct: 1.5,
  termMonths: 12,
  lifeInsurance: 0,
};

const EXAMPLE_STATE: CalculatorInputs = {
    price: 29.99,
    monthlyUnits: 450,
    cogs: 7.2,
    inbound: 1.4,
    prep: 0.3,
    otherUnit: 0.25,
    tariff: 0.2,
    saleTaxPct: 0,
    referralPct: 15,
    fulfillmentFee: 4.35,
    closingFee: 0,
    storagePerUnit: 0.18,
    acosPct: 9,
    fixedMonthly: 300,
    sellingPlan: 39.99,
    initialUnits: 800,
    totalInvestment: 12000,
    loanAmount: 9000,
    rateMode: "annual",
    aprPct: 17,
    monthlyRatePct: 1.4,
    termMonths: 18,
    lifeInsurance: 12,
};

const PARAM_LABELS: Record<keyof CalculatorInputs, string> = {
  price: "Precio de venta",
  monthlyUnits: "Unidades vendidas por mes",
  cogs: "Costo de producto (CoGS)",
  inbound: "Envío a Amazon (inbound)",
  prep: "Empaque/Prep por unidad",
  otherUnit: "Otros costos unitarios",
  tariff: "Arancel/Importación",
  saleTaxPct: "Impuesto sobre venta (%)",
  referralPct: "Referral fee (%)",
  fulfillmentFee: "Fulfillment FBA por unidad",
  closingFee: "Variable/Closing fee",
  storagePerUnit: "Almacenamiento por unidad",
  acosPct: "Publicidad (ACoS) (%)",
  fixedMonthly: "Costos fijos mensuales",
  sellingPlan: "Plan profesional Amazon",
  initialUnits: "Unidades primer pedido",
  totalInvestment: "Inversión total",
  loanAmount: "Monto del préstamo",
  rateMode: "Tipo de tasa",
  aprPct: "Interés anual (APR) (%)",
  monthlyRatePct: "Interés mensual (%)",
  termMonths: "Plazo (meses)",
  lifeInsurance: "Seguro de vida mensual",
};

type Stringified<T> = { [K in keyof T]: T[K] extends 'annual' | 'monthly' ? T[K] : string };

const stringifyState = (state: CalculatorInputs): Stringified<CalculatorInputs> => {
    const stringified: any = {};
    for (const key in state) {
        const k = key as keyof CalculatorInputs;
        stringified[k] = String(state[k]);
    }
    return stringified;
};

export default function App() {
  // ---------- Helpers ----------
  const num = (v: any): number => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return v;
    const s = String(v).replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };
  const pct = (v: number) => v / 100;
  const fmt = (v: number) => `${currency}\u00A0${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtN = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- Default state ----------
  const [currency, setCurrency] = useState<string>("USD");
  const [useEstimatedInvestment, setUseEstimatedInvestment] = useState(true);
  const [inputs, setInputs] = useState<Stringified<CalculatorInputs>>(stringifyState(INITIAL_STATE));
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [productNameToExport, setProductNameToExport] = useState("Mi Producto FBA");
  
  const handleInputChange = (key: keyof CalculatorInputs, value: string) => {
    setInputs(prev => ({...prev, [key]: value}));
  };

  const handleRateModeChange = (mode: 'annual' | 'monthly') => {
    setInputs(prev => ({ ...prev, rateMode: mode }));
  };

  const fillExample = () => setInputs(stringifyState(EXAMPLE_STATE));
  const reset = () => setInputs(stringifyState(INITIAL_STATE));

  // ---------- Core calculations ----------
  const calc = useMemo(() => {
    const price = num(inputs.price);
    const units = Math.max(0, Math.floor(num(inputs.monthlyUnits)));
    const cogs = num(inputs.cogs);
    const inbound = num(inputs.inbound);
    const prep = num(inputs.prep);
    const otherUnit = num(inputs.otherUnit);
    const tariff = num(inputs.tariff);
    const saleTaxPctVal = pct(num(inputs.saleTaxPct));
    const referralPctVal = pct(num(inputs.referralPct));
    const fulfillmentFee = num(inputs.fulfillmentFee);
    const closingFee = num(inputs.closingFee);
    const storagePerUnit = num(inputs.storagePerUnit);
    const acos = pct(num(inputs.acosPct));
    const fixedMonthly = num(inputs.fixedMonthly) + num(inputs.sellingPlan);
    const totalInvestmentManual = num(inputs.totalInvestment);
    const loanAmount = Math.max(0, num(inputs.loanAmount));
    const n = Math.max(1, Math.floor(num(inputs.termMonths)));
    const monthlyRate = inputs.rateMode === "annual" ? pct(num(inputs.aprPct)) / 12 : pct(num(inputs.monthlyRatePct));
    const lifeInsurance = Math.max(0, num(inputs.lifeInsurance));

    const roiCostBase = cogs + inbound + prep + otherUnit + tariff;
    const saleTaxPerUnit = price * saleTaxPctVal;
    const referralFee = price * referralPctVal;
    const adsPerUnit = price * acos;
    const amazonFeesPerUnit = referralFee + fulfillmentFee + closingFee + storagePerUnit;
    const variableCostsPerUnit = roiCostBase;
    
    const totalVariableCostPerUnit = variableCostsPerUnit + amazonFeesPerUnit + adsPerUnit + saleTaxPerUnit;

    const netProfitPerUnit = price - totalVariableCostPerUnit;
    const marginPct = price > 0 ? netProfitPerUnit / price : 0;
    const roiClassic = roiCostBase > 0 ? netProfitPerUnit / roiCostBase : 0;
    const roiTotalCost = totalVariableCostPerUnit > 0 ? netProfitPerUnit / totalVariableCostPerUnit : 0;

    const denominator = 1 - referralPctVal - acos - saleTaxPctVal;
    const numerator = roiCostBase + fulfillmentFee + closingFee + storagePerUnit;
    const breakEvenPrice = denominator > 0 ? (numerator / denominator) : NaN;

    const revenueMonthly = price * units;
    const netBeforeFixed = netProfitPerUnit * units;
    const netBeforeDebt = netBeforeFixed - fixedMonthly;

    const initialUnits = Math.max(0, Math.floor(num(inputs.initialUnits)));
    const estimatedInvestment = roiCostBase * initialUnits;
    const totalInvestment = useEstimatedInvestment ? estimatedInvestment : totalInvestmentManual;
    const equity = Math.max(0, totalInvestment - loanAmount);

    const r = monthlyRate;
    const payment = r > 0 ? loanAmount * (r / (1 - Math.pow(1 + r, -n))) : (loanAmount / n);

    const schedule: any[] = [];
    let balance = loanAmount;
    let cumCash = 0;

    const monthlyCashflowBase = netBeforeDebt;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      let principal = payment - interest;
      if (principal < 0) principal = 0;
      if (principal > balance) principal = balance;
      balance = Math.max(0, balance - principal);
      const paymentTotal = payment + lifeInsurance;
      const monthlyCashflow = monthlyCashflowBase - paymentTotal;
      cumCash += monthlyCashflow;
      schedule.push({ month: m, payment, insurance: lifeInsurance, paymentTotal, interest, principal, balance, monthlyCashflow, cumCash });
    }

    const netAfterDebt = netBeforeDebt - (payment + lifeInsurance);
    const cashOnCashMonthly = equity > 0 ? (netAfterDebt / equity) : 0;
    const cashOnCashAnnual = cashOnCashMonthly * 12;

    const breakEvenUnits = netProfitPerUnit > 0 ? Math.ceil((fixedMonthly + payment + lifeInsurance) / netProfitPerUnit) : Infinity;

    return {
      price, referralFee, fulfillmentFee, closingFee, storagePerUnit, adsPerUnit, saleTaxPerUnit,
      amazonFeesPerUnit, variableCostsPerUnit, roiCostBase, netProfitPerUnit, marginPct, roiClassic, roiTotalCost, breakEvenPrice,
      units, revenueMonthly, fixedMonthly, netBeforeFixed, netBeforeDebt, netAfterDebt,
      totalInvestment, estimatedInvestment, equity, loanAmount, monthlyRate, n, payment, lifeInsurance, schedule,
      roiNoLoanMonthly: totalInvestment>0 ? (netBeforeDebt / totalInvestment) : 0,
      roiNoLoanAnnual: totalInvestment>0 ? (netBeforeDebt / totalInvestment) * 12 : 0,
      roiWithLoanMonthly: totalInvestment>0 ? (netAfterDebt / totalInvestment) : 0,
      roiWithLoanAnnual: totalInvestment>0 ? (netAfterDebt / totalInvestment) * 12 : 0,
      cashOnCashMonthly, cashOnCashAnnual, breakEvenUnits,
    };
  }, [inputs, useEstimatedInvestment, currency]);

  // ---------- Export Excel ----------
  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const title = `Simulación FBA: ${productNameToExport}`;
    const filenameSafe = productNameToExport.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `fba_sim_${filenameSafe}_${new Date().toISOString().slice(0,10)}.xlsx`;

    // --- Sheet 1: Parameters ---
    const paramsData: any[][] = [[title], [], ["Parámetro", "Valor"]];
    Object.entries(inputs).forEach(([k, v]) => {
      const key = k as keyof CalculatorInputs;
      paramsData.push([PARAM_LABELS[key] || k, v]);
    });
    const ws_params = XLSX.utils.aoa_to_sheet(paramsData);
    ws_params['!cols'] = [{ wch: 35 }, { wch: 20 }];
    ws_params['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, ws_params, "Parámetros");

    // --- Sheet 2: Results & KPIs ---
    const resultsData: any[][] = [[title], [], ["Métrica", "Valor", "Comentario"]];
    const pushRes = (l: string, v: any, c = "") => resultsData.push([l, v, c]);
    pushRes("Precio de equilibrio", isNaN(calc.breakEvenPrice) ? "N/A" : calc.breakEvenPrice, `Moneda: ${currency}`);
    pushRes("Unidades de equilibrio", Number.isFinite(calc.breakEvenUnits)? Math.ceil(calc.breakEvenUnits):"∞", "Unidades/mes");
    pushRes("Utilidad neta por unidad", calc.netProfitPerUnit, `Moneda: ${currency}`);
    pushRes("Margen (%)", calc.marginPct * 100, "Utilidad / Precio");
    pushRes("ROI clásico (%)", calc.roiClassic * 100, "Utilidad / CoGS");
    pushRes("ROI (costo total) (%)", calc.roiTotalCost * 100, "Utilidad / Costo variable total");
    resultsData.push([]);
    pushRes("Ingresos mensuales", calc.revenueMonthly);
    pushRes("Utilidad antes de fijos", calc.netBeforeFixed);
    pushRes("Utilidad antes de deuda", calc.netBeforeDebt);
    pushRes("Utilidad después de deuda", calc.netAfterDebt, "Flujo de caja neto mensual");
    resultsData.push([]);
    pushRes("Inversión total usada", calc.totalInvestment);
    pushRes("Capital propio (equity)", calc.equity);
    pushRes("Pago mensual préstamo (total)", calc.payment + calc.lifeInsurance);
    pushRes("Tasa efectiva mensual (%)", calc.monthlyRate * 100);
    resultsData.push([]);
    pushRes("ROI mensual (sin préstamo) (%)", calc.roiNoLoanMonthly * 100);
    pushRes("ROI anual (sin préstamo) (%)", calc.roiNoLoanAnnual * 100);
    pushRes("ROI mensual (con préstamo) (%)", calc.roiWithLoanMonthly * 100);
    pushRes("ROI anual (con préstamo) (%)", calc.roiWithLoanAnnual * 100);
    resultsData.push([]);
    pushRes("Cash-on-cash mensual (%)", calc.cashOnCashMonthly * 100, "Sobre capital propio");
    pushRes("Cash-on-cash anual (%)", calc.cashOnCashAnnual * 100, "Sobre capital propio");
    
    const ws_results = XLSX.utils.aoa_to_sheet(resultsData);
    ws_results['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 30 }];
    ws_results['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    XLSX.utils.book_append_sheet(wb, ws_results, "Resultados y KPIs");
    
    // --- Sheet 3: Amortization Schedule ---
    const amortHeader = ['Mes', 'Cuota (sin seguro)', 'Seguro', 'Pago total', 'Interés', 'Capital', 'Saldo', 'Flujo neto mes', 'Flujo acumulado'];
    const amortData: any[][] = [[title], [], amortHeader];
    calc.schedule.forEach(r => {
      amortData.push([r.month, r.payment, r.insurance, r.paymentTotal, r.interest, r.principal, r.balance, r.monthlyCashflow, r.cumCash]);
    });
    const ws_amort = XLSX.utils.aoa_to_sheet(amortData);
    ws_amort['!cols'] = Array(amortHeader.length).fill({ wch: 18 });
    ws_amort['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: amortHeader.length - 1 } }];
    XLSX.utils.book_append_sheet(wb, ws_amort, "Amortización");

    // --- Download ---
    XLSX.writeFile(wb, filename);
    setShowDownloadModal(false);
  };
  
  const fieldProps = (id: keyof CalculatorInputs) => ({
    id,
    value: inputs[id] as string,
    onChange: handleInputChange,
  });

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Calculator className="h-7 w-7 text-indigo-600" /> Calculadora de Rentabilidad FBA con Préstamo
            </h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Ingresa tus costos por unidad, comisiones de Amazon, publicidad y parámetros del préstamo. La app estima margen, ROI, precio de equilibrio y flujo mensual tras deuda.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28" />
            <Button variant="secondary" onClick={fillExample}><BarChart3 className="h-4 w-4 mr-2"/>Ejemplo</Button>
            <Button variant="outline" onClick={reset}><RefreshCw className="h-4 w-4 mr-2"/>Restablecer</Button>
            <Button variant="outline" onClick={() => setShowDownloadModal(true)}><Download className="h-4 w-4 mr-2"/>Descargar Excel</Button>
          </div>
        </header>

        <Tabs defaultValue="inputs">
          <TabsList>
            <TabsTrigger value="inputs">Parámetros</TabsTrigger>
            <TabsTrigger value="perunit">Resultados</TabsTrigger>
            <TabsTrigger value="cash">Flujo & Deuda</TabsTrigger>
            <TabsTrigger value="amort">Amortización</TabsTrigger>
          </TabsList>

          <TabsContent value="inputs">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader><CardTitle><DollarSign className="h-5 w-5 inline-block mr-2 text-indigo-500"/>Precio & Ventas</CardTitle></CardHeader>
                  <CardContent className="space-y-4"><Field label="Precio de venta" right={currency} {...fieldProps('price')} /><Field label="Unidades/mes" right="uds" {...fieldProps('monthlyUnits')} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Costos por unidad</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Costo de producto (CoGS)" right={currency} {...fieldProps('cogs')} /><Field label="Envío a Amazon (inbound)" right={currency} {...fieldProps('inbound')} /><Field label="Empaque/Prep por unidad" right={currency} {...fieldProps('prep')} /><Field label="Otros unitarios" right={currency} {...fieldProps('otherUnit')} /><Field label="Arancel/Importación" right={currency} {...fieldProps('tariff')} /><Field label="Impuesto sobre venta (opcional)" right="%" {...fieldProps('saleTaxPct')} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Comisiones Amazon</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Referral fee" right="% del precio" hint="Comúnmente ~15% según categoría." {...fieldProps('referralPct')} /><Field label="Fulfillment FBA por unidad" right={currency} {...fieldProps('fulfillmentFee')} /><Field label="Variable/Closing fee" right={currency} {...fieldProps('closingFee')} /><Field label="Almacenamiento por unidad" right={currency} {...fieldProps('storagePerUnit')} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Publicidad & Fijos</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Publicidad (ACoS)" right="% del precio" {...fieldProps('acosPct')} /><Field label="Costos fijos mensuales" right={currency} {...fieldProps('fixedMonthly')} /><Field label="Plan profesional Amazon" right={currency} hint="$39.99/mes típico en USA." {...fieldProps('sellingPlan')} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Inventario & Inversión</CardTitle></CardHeader>
                  <CardContent className="space-y-4"><Field label="Unidades primer pedido" right="uds" {...fieldProps('initialUnits')} /><div className="flex items-center justify-between py-1"><Label>Usar inversión estimada ({fmt(calc.estimatedInvestment)})</Label><Switch checked={useEstimatedInvestment} onCheckedChange={setUseEstimatedInvestment} /></div><Field label="Inversión total (manual)" right={currency} disabled={useEstimatedInvestment} {...fieldProps('totalInvestment')} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle><PiggyBank className="h-5 w-5 inline-block mr-2 text-indigo-500"/>Préstamo</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Monto del préstamo" right={currency} {...fieldProps('loanAmount')} />
                    <div className="space-y-1"><Label>Tipo de tasa</Label><div className="flex gap-2"><Button type="button" size="sm" variant={inputs.rateMode==='annual'?"default":"outline"} onClick={()=> handleRateModeChange('annual')}>Anual (APR)</Button><Button type="button" size="sm" variant={inputs.rateMode==='monthly'?"default":"outline"} onClick={()=> handleRateModeChange('monthly')}>Mensual</Button></div></div>
                    {inputs.rateMode === 'annual' ? (<Field label="Interés anual (APR)" right="%" {...fieldProps('aprPct')} />) : (<Field label="Interés mensual" right="%" {...fieldProps('monthlyRatePct')} />)}
                    <Field label="Plazo (meses)" right="meses" {...fieldProps('termMonths')} />
                    <Field label="Seguro de vida mensual" right={currency} hint="Cargo fijo que suma el banco a cada cuota." {...fieldProps('lifeInsurance')} />
                    <div className="rounded-md bg-slate-100 p-3 text-sm text-slate-600 md:col-span-2">Tasa efectiva: <b>{(calc.monthlyRate*100).toFixed(4)}% mensual</b>. Cuota (sin seguro): <b>{fmt(calc.payment)}</b>. Pago total: <b>{fmt(calc.payment + num(inputs.lifeInsurance))}</b>.</div>
                  </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="perunit">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={<Percent />} label="Margen" value={(calc.marginPct*100).toFixed(2)+"%"} sub={`Utilidad por unidad: ${fmt(calc.netProfitPerUnit)}`} />
              <Stat icon={<BarChart3 />} label="ROI clásico" value={(calc.roiClassic*100).toFixed(2)+"%"} sub="Profit / CoGS" />
              <Stat icon={<BarChart3 />} label="ROI costo total" value={(calc.roiTotalCost*100).toFixed(2)+"%"} sub="Incluye fees y ads" />
              <Stat icon={<DollarSign />} label="Precio equilibrio" value={isNaN(calc.breakEvenPrice)?"—":fmt(calc.breakEvenPrice)} sub={`Uds. equilibrio: ${Number.isFinite(calc.breakEvenUnits)?Math.ceil(calc.breakEvenUnits):"∞"}`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Desglose por unidad</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between font-semibold"><span>Precio de venta</span><span>{fmt(calc.price)}</span></div><Separator />
                    <div className="flex justify-between text-slate-600"><span>Referral fee</span><span>- {fmt(calc.referralFee)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Fulfillment FBA</span><span>- {fmt(calc.fulfillmentFee)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Closing/Variable</span><span>- {fmt(calc.closingFee)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Almacenamiento</span><span>- {fmt(calc.storagePerUnit)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Publicidad (ACoS)</span><span>- {fmt(calc.adsPerUnit)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Impuesto sobre venta</span><span>- {fmt(calc.saleTaxPerUnit)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Costo Producto & Logística</span><span>- {fmt(calc.variableCostsPerUnit)}</span></div><Separator />
                    <div className={`flex justify-between font-semibold text-lg ${calc.netProfitPerUnit>=0?"text-emerald-600":"text-rose-600"}`}><span>Utilidad neta por unidad</span><span>{fmt(calc.netProfitPerUnit)}</span></div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Margen y ROI estimados</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{ name: "Margen %", Valor: calc.marginPct*100 }, { name: "ROI clásico %", Valor: calc.roiClassic*100 }, { name: "ROI costo total %", Valor: calc.roiTotalCost*100 }]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <ReTooltip formatter={(v:any)=>`${fmtN(v)}%`} />
                      <Legend />
                      <Bar dataKey="Valor" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="cash">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={<DollarSign />} label="Ingresos/mes" value={fmt(calc.revenueMonthly)} />
              <Stat icon={<DollarSign />} label="Utilidad antes de fijos" value={fmt(calc.netBeforeFixed)} />
              <Stat icon={<DollarSign />} label="Utilidad antes de deuda" value={fmt(calc.netBeforeDebt)} sub={`Fijos: ${fmt(calc.fixedMonthly)}`} />
              <Stat icon={<PiggyBank />} label="Pago préstamo" value={fmt(calc.payment + num(inputs.lifeInsurance))} sub={`${calc.n} meses @ ${(calc.monthlyRate*100).toFixed(3)}% m.v.`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Flujo neto mensual (después de deuda)</CardTitle></CardHeader>
                  <CardContent><div className={`text-3xl font-semibold ${calc.netAfterDebt>=0?"text-emerald-600":"text-rose-600"}`}>{fmt(calc.netAfterDebt)}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Rentabilidad sobre la inversión</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span>ROI mensual (sin préstamo)</span><span className="font-medium">{(calc.roiNoLoanMonthly*100).toFixed(2)}%</span></div>
                    <div className="flex justify-between items-center"><span>ROI anual (sin préstamo)</span><span className="font-medium">{(calc.roiNoLoanAnnual*100).toFixed(2)}%</span></div>
                    <Separator />
                    <div className="flex justify-between items-center"><span>ROI mensual (con préstamo)</span><span className="font-medium">{(calc.roiWithLoanMonthly*100).toFixed(2)}%</span></div>
                    <div className="flex justify-between items-center"><span>ROI anual (con préstamo)</span><span className="font-medium">{(calc.roiWithLoanAnnual*100).toFixed(2)}%</span></div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>ROI sobre capital propio (Equity)</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Inversión usada</span><span>{fmt(calc.totalInvestment)}</span></div>
                  <div className="flex justify-between"><span>Préstamo</span><span>{fmt(calc.loanAmount)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Capital propio (equity)</span><span>{fmt(calc.equity)}</span></div>
                  <Separator />
                  <div className="flex justify-between items-center text-base"><span>Cash-on-cash mensual</span><span className="font-semibold text-emerald-600">{(calc.cashOnCashMonthly*100).toFixed(2)}%</span></div>
                  <div className="flex justify-between items-center text-base"><span>Cash-on-cash anual</span><span className="font-semibold text-emerald-600">{(calc.cashOnCashAnnual*100).toFixed(2)}%</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Evolución de saldo vs flujo</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={calc.schedule} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Meses', position: 'insideBottom', offset: -5 }}/>
                      <YAxis tickFormatter={(v)=>fmtN(v)} />
                      <ReTooltip formatter={(v:any)=>fmt(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="balance" name="Saldo préstamo" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cumCash" name="Flujo acumulado" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="amort">
            <Card>
              <CardHeader><CardTitle>Tabla de amortización (pago fijo)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-auto rounded border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        {['Mes', 'Cuota', 'Seguro', 'Pago total', 'Interés', 'Capital', 'Saldo', 'Flujo neto mes', 'Flujo acumulado'].map(h=>(<th key={h} className="text-right p-2 font-medium first:text-left">{h}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {calc.schedule.map((r:any) => (
                        <tr key={r.month} className="border-t border-slate-200 odd:bg-white even:bg-slate-50/50 text-slate-800">
                          <td className="p-2 text-left">{r.month}</td>
                          <td className="p-2 text-right">{fmtN(r.payment)}</td>
                          <td className="p-2 text-right">{fmtN(r.insurance)}</td>
                          <td className="p-2 text-right font-medium">{fmtN(r.paymentTotal)}</td>
                          <td className="p-2 text-right text-rose-600">{fmtN(r.interest)}</td>
                          <td className="p-2 text-right text-emerald-600">{fmtN(r.principal)}</td>
                          <td className="p-2 text-right font-semibold">{fmtN(r.balance)}</td>
                          <td className="p-2 text-right">{fmtN(r.monthlyCashflow)}</td>
                          <td className="p-2 text-right">{fmtN(r.cumCash)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-xs text-slate-500 pt-4 border-t">
          <p>
            Notas: 1) En "mensual vencida" la tasa ingresada se usa como tasa efectiva mensual directa. 2) El seguro de vida se suma como valor fijo por mes. 3) En sistema francés, los primeros pagos tienen mayor carga de intereses y el abono a capital crece con el tiempo.
          </p>
        </footer>
      </div>
      
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Descargar Simulación Excel</h3>
            <div className="space-y-2">
              <Label htmlFor="productName">Nombre del Producto</Label>
              <Input 
                id="productName"
                value={productNameToExport}
                onChange={(e) => setProductNameToExport(e.target.value)}
                placeholder="Ej: Botella de agua 500ml"
                onKeyDown={(e) => e.key === 'Enter' && exportXLSX()}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDownloadModal(false)}>Cancelar</Button>
              <Button onClick={exportXLSX}><Download className="h-4 w-4 mr-2"/>Descargar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
