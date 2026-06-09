import { Ionicons } from "@expo/vector-icons";
import { API_ORIGIN } from "../constants/api";
import { DocumentRecord } from "../types/car";

export function getDocumentUrl(fileUrl: string) {
  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  if (fileUrl.startsWith("/uploads")) {
    return `${API_ORIGIN}${fileUrl}`;
  }

  return `${API_ORIGIN}/uploads/documents/${fileUrl}`;
}

export function getFileExtension(fileUrl: string) {
  const cleanUrl = fileUrl.split("?")[0];
  const extension = cleanUrl.split(".").pop();

  return extension ? extension.toUpperCase() : "FILE";
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR");
}

export function getDocumentConfig(
  type: DocumentRecord["type"],
  activeMode: "light" | "dark",
): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  const isDark = activeMode === "dark";

  const configs = {
    REGISTRATION: {
      icon: "document-text-outline",
      color: "#EF4444",
      bg: isDark ? "#450A0A" : "#FEE2E2",
    },
    INSURANCE: {
      icon: "shield-checkmark-outline",
      color: "#2563EB",
      bg: isDark ? "#172554" : "#DBEAFE",
    },
    INSPECTION: {
      icon: "clipboard-outline",
      color: "#16A34A",
      bg: isDark ? "#052E16" : "#DCFCE7",
    },
    INVOICE: {
      icon: "receipt-outline",
      color: "#F97316",
      bg: isDark ? "#431407" : "#FFEDD5",
    },
    SERVICE_REPORT: {
      icon: "construct-outline",
      color: "#0EA5E9",
      bg: isDark ? "#082F49" : "#E0F2FE",
    },
    PURCHASE_INVOICE: {
      icon: "document-attach-outline",
      color: "#7C3AED",
      bg: isDark ? "#2E1065" : "#EDE9FE",
    },
    ROADSIDE_ASSISTANCE: {
      icon: "medkit-outline",
      color: "#F97316",
      bg: isDark ? "#431407" : "#FFEDD5",
    },
    OTHER: {
      icon: "document-outline",
      color: "#64748B",
      bg: isDark ? "#1E293B" : "#F1F5F9",
    },
  } as const;

  return configs[type] ?? configs.OTHER;
}