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
  fuelType: string,
  averageFuelPrice: number,
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
  fuelRecords : FuelRecord,
  expenses: ExpenseRecord[];
};

export type CarImage = {
  url?: string;
  fileName: boolean;
  mimeType?: string;
};

export type CarEdit = {
  brand: string;
  model: string;
  plate: string;
  currentKm: number;
  year: number,
  images: CarImage[];
};

export type FuelRecord = {
  id: string;
  fuelDate: string;
  liters: number;
  pricePerLiter: string;
  totalAmount: string;
  km: number;
  consumption: number
};

export type ExpenseRecord = {
  id: string;
  title: string;
  description: number;
  amount: number;
  category: ExpenseCategory[]
};

export enum ExpenseCategory {
  FUEL = "FUEL",
  SERVICE = "SERVICE",
  INSURANCE = "INSURANCE",
  TAX = "TAX",
  PARKING = "PARKING",
  CAR_WASH = "CAR_WASH",
  TOLL = "TOLL",
  TIRE = "TIRE",
  DOCUMENT = "DOCUMENT",
  OTHER = "OTHER",
}

export type CarTabKey =
  | "overview"
  | "services"
  | "fuel"
  | "expenses"
  | "documents";