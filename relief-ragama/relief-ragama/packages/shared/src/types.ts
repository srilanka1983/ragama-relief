export const STATUSES = [
  "Safe",
  "Needs Immediate Rescue",
  "Needs Food",
  "Needs Medical Aid",
  "Needs Non-Food Items",
  "Evacuated",
] as const;

export type HouseholdStatus = (typeof STATUSES)[number];

export interface Household {
  id: number;
  house_number: string;
  head_name: string;
  resident_count: number;
  gps_lat: number | null;
  gps_lng: number | null;
  status: HouseholdStatus;
  notes: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type Role = "admin" | "volunteer";

export interface UserRole {
  id: number;
  email: string;
  role: Role;
  created_at: string;
}

export interface SessionUser {
  email: string;
  name: string | null;
  picture: string | null;
}

export const STATUS_COLORS: Record<HouseholdStatus, string> = {
  Safe: "#16a34a",
  "Needs Immediate Rescue": "#dc2626",
  "Needs Food": "#f59e0b",
  "Needs Medical Aid": "#d946ef",
  "Needs Non-Food Items": "#6366f1",
  Evacuated: "#64748b",
};
