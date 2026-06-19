export type Service = {
  id: string;
  title: string;
  carId: string;
  createdBy: User;
  serviceDate: string;
  km: number;
  currency: string;
  description: string;
  amount: string;
  car: CarDetail;
  category: ServiceCategory;
  createdAt: string;
  attachments: ServiceAttachments[]
};

export type ServiceAttachments = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
};


export type ServiceCategory =
  | "OIL_CHANGE"
  | "FILTER_CHANGE"
  | "BRAKE"
  | "TIRE"
  | "BATTERY"
  | "ENGINE"
  | "TRANSMISSION"
  | "SUSPENSION"
  | "AC"
  | "INSPECTION"
  | "WASH"
  | "OTHER";

export type User = {
  currency: string;
  email: string;
  name: string;
  distanceUnit: string;
  theme: string;
  language: string;
};

export type DocumentRecord = {
  id: string;
  carId: string;
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
  car: CarDetail;
  attachments: DocumentAttachment[];
};

export type DocumentAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
};

export type HistoryType = "SERVICE" | "FUEL" | "EXPENSE" | "DOCUMENT";

export type OverviewData = {
  id: string;
  type: HistoryType;
  title: string;
  description: string;
  date: string;
  mileage?: number;
  amount?: number;
  currency: string;
};

export type CarDetail = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  plate: string;
  imageUrl?: string;
  photos: CarImage[];
  currentKm: number;
  monthlyExpenses: string;
  monthlyChangePercent: number;
  totalExpenses: string;
  services: Service[];
  documents: DocumentRecord[];
  fuelType: string;
  averageFuelPrice: number;
  owner?: {
    currency: string;
    distanceUnit: string;
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
  fuelRecords: FuelRecord;
  expenses: ExpenseRecord[];
  thisMonthServiceTotal: number;
  lastFuelPricePerLiter?: number | string | null;
};

export type CarImage = {
  id: string;
  url?: string;
  fileName: string;
  is_cover: boolean;
  mimeType?: string;
};

export type CarEdit = {
  id: string;
  brand: string;
  imageUrl: string;
  model: string;
  plate: string;
  currentKm: number;
  fuelType: string;
  year: number;
  photos: CarImage[];
};

export type FuelResponse = {
  fuels: FuelRecord[];
  averageFuelConsumption: number;
  averageFuelPrice: number;
};
export type FuelRecord = {
  id: string;
  carId: string;
  createdBy: User;
  fuelDate: string;
  liters: number;
  pricePerLiter: string;
  totalAmount: string;
  km: number;
  consumption: number;
  createdAt: string;
};

export type ExpenseRecord = {
  id: string;
  title: string;
  description: number;
  amount: number;
  category: ExpenseCategory[];
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

export type Reminder = {
  id: string;
  title: string;
  car: string;
  date: string;
};

export type HomeData = {
  userName: string;
  totalCars: number;
  thisMonthExpenses: string;
  expenseChange: string;
  upcomingReminders: number;
  ownedCars: CarDetail[];
  reminders: Reminder[];
};

export type CarTabKey =
  | "overview"
  | "services"
  | "fuel"
  | "expenses"
  | "documents";
