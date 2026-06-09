export type Service = {
  id: string;
  title: string;
  serviceDate: string;
  km: number;
  amount: string;
  currency: string;
  type?: "oil" | "brake" | "filter" | "spark" | "coolant";
};

export type DocumentRecord = {
  id: string;
  type:
    | "REGISTRATION"
    | "INSURANCE"
    | "INSPECTION"
    | "INVOICE"
    | "SERVICE_REPORT"
    | "PURCHASE_INVOICE"
    | "ROADSIDE_ASSISTANCE"
    | "OTHER";
  title: string;
  fileUrl: string;
  expiresAt?: string | null;
  createdAt: string;
};

export type CarDetail = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  plate: string;
  imageUrl?: string;
  currentKm: number;
  monthlyExpenses: string;
  monthlyChangePercent: number;
  totalExpenses: string;
  services: Service[];
  documents: DocumentRecord[];
  owner?: {
    currency: string;
  };
  lastService?: {
    date: string;
    title: string;
  };
  lastFuel?: {
    date: string;
    amount: string;
    cost: string;
  };
  averageFuelConsumption?: string;
  costPerKm?: string;
};

export type FuelRecord = {
  id: string;
  fuelDate: string;
  liters: number;
  pricePerLiter: string;
  totalAmount: string;
  km: number;
};

export type CarTabKey =
  | "overview"
  | "services"
  | "fuel"
  | "expenses"
  | "documents";