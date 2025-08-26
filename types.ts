
export interface CalculatorInputs {
  price: number;
  monthlyUnits: number;
  cogs: number;
  inbound: number;
  prep: number;
  otherUnit: number;
  tariff: number;
  saleTaxPct: number;
  referralPct: number;
  fulfillmentFee: number;
  closingFee: number;
  storagePerUnit: number;
  acosPct: number;
  fixedMonthly: number;
  sellingPlan: number;
  initialUnits: number;
  totalInvestment: number;
  loanAmount: number;
  rateMode: 'annual' | 'monthly';
  aprPct: number;
  monthlyRatePct: number;
  termMonths: number;
  lifeInsurance: number;
}