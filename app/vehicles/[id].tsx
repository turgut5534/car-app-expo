import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Linking,
  Alert,
  Modal,
  Image,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";

type Service = {
  id: string;
  title: string;
  serviceDate: string;
  km: number;
  amount: string;
  currency: string;
  type?: "oil" | "brake" | "filter" | "spark" | "coolant";
};

type DocumentRecord = {
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

type CarDetail = {
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

const API_ORIGIN = "http://192.168.0.10:3000";
const API_URL = `${API_ORIGIN}/cars`;

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRecord | null>(null);

  const fetchCar = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data?.message || t("cars.detailLoadFailed"));
      }

      setCar({
        ...data,
        services: data.services ?? [],
        documents: data.documents ?? [],
      });
    } catch {
      setCar(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      fetchCar();
    }, [fetchCar]),
  );

  useFocusEffect(
    useCallback(() => {
      fetchCar();
    }, [id]),
  );
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>{t("cars.detailLoadFailed")}</Text>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: "overview", label: t("cars.overview") },
    { key: "services", label: t("cars.services") },
    { key: "fuel", label: t("cars.fuel") },
    { key: "expenses", label: t("cars.expenses") },
    { key: "documents", label: t("cars.documents") },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {car.brand || ""} {car.model || car.name}
          </Text>

          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={
            car.imageUrl
              ? { uri: `${API_ORIGIN}/uploads/cars/${car.imageUrl}` }
              : require("../../assets/images/image.png")
          }
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View>
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.plate}>{car.plate}</Text>
            </View>

            <View style={styles.kmBadge}>
              <Text style={[styles.kmText, { color: theme.primary }]}>
                {car.currentKm?.toLocaleString() ?? 0} km
              </Text>
            </View>
          </View>
        </ImageBackground>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabs, { borderBottomColor: theme.border }]}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && {
                  borderBottomColor: theme.primary,
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab.key ? theme.primary : theme.mutedText,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === "overview" ? (
          <View style={styles.grid}>
            <StatCard
              title={t("cars.thisMonthExpenses")}
              value={car.monthlyExpenses}
              sub={`↑ ${car.monthlyChangePercent}% ${t("cars.vsLastMonth")}`}
              icon="trending-up-outline"
              accent="#16A34A"
            />

            <StatCard
              title={t("cars.totalExpenses")}
              value={car.totalExpenses}
              sub={t("cars.allTime")}
              icon="stats-chart-outline"
              accent={theme.primary}
            />

            <InfoCard
              icon="construct-outline"
              title={t("cars.lastService")}
              line1={car.lastService?.date || "-"}
              line2={car.lastService?.title || "-"}
            />

            <InfoCard
              icon="document-text-outline"
              title={t("cars.averageFuelConsumption")}
              line1={car.averageFuelConsumption || "-"}
              line2=""
            />

            <InfoCard
              icon="water-outline"
              title={t("cars.lastFuel")}
              line1={car.lastFuel?.date || "-"}
              line2={
                car.lastFuel
                  ? `${car.lastFuel.amount} / ${car.lastFuel.cost}`
                  : "-"
              }
            />

            <InfoCard
              icon="speedometer-outline"
              title={t("cars.costPerKm")}
              line1={car.costPerKm || "-"}
              line2=""
            />
          </View>
        ) : null}

        {activeTab === "services" ? (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push(`/vehicles/${id}/services/create`)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{t("cars.addService")}</Text>
            </TouchableOpacity>

            {car.services.length > 0 ? (
              car.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  currency={car.owner?.currency || service.currency || ""}
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyTab,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={{ color: theme.mutedText }}>
                  {t("cars.noServices")}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {activeTab === "documents" ? (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push(`/vehicles/${id}/documents/create`)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{t("cars.addDocument")}</Text>
            </TouchableOpacity>

            {car.documents.length > 0 ? (
              car.documents.map((document) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  onPress={() => setSelectedDocument(document)}
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyTab,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={{ color: theme.mutedText }}>
                  {t("cars.noDocuments")}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {activeTab !== "overview" &&
        activeTab !== "services" &&
        activeTab !== "documents" ? (
          <View
            style={[
              styles.emptyTab,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={{ color: theme.mutedText }}>
              {t("cars.tabComingSoon")}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={!!selectedDocument}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDocument(null)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.card,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={[styles.modalTitle, { color: theme.text }]}
              >
                {selectedDocument?.title}
              </Text>

              {selectedDocument ? (
                <Text
                  numberOfLines={1}
                  style={[styles.modalSubtitle, { color: theme.mutedText }]}
                >
                  {getFileExtension(selectedDocument.fileUrl)}
                </Text>
              ) : null}
            </View>

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setSelectedDocument(null)}
            >
              <Ionicons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>

          {selectedDocument ? (
            <DocumentPreview document={selectedDocument} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function DocumentItem({
  document,
  onPress,
}: {
  document: DocumentRecord;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const config = getDocumentConfig(document.type, theme.activeMode);

  const subtitle = document.expiresAt
    ? `${t("cars.validUntil")} ${formatDate(document.expiresAt)}`
    : `${t("cars.addedOn")} ${formatDate(document.createdAt)}`;

  return (
    <TouchableOpacity
      style={[
        styles.documentCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.documentLeft}>
        <View style={[styles.documentIconBox, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.documentTitle, { color: theme.text }]}>
            {document.title}
          </Text>

          <Text style={[styles.documentSubtitle, { color: theme.mutedText }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.documentRight}>
        <Text style={[styles.documentType, { color: theme.text }]}>
          {getFileExtension(document.fileUrl)}
        </Text>

        <TouchableOpacity onPress={(e) => e.stopPropagation()}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={theme.mutedText}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function DocumentPreview({ document }: { document: DocumentRecord }) {
  const { theme } = useAppTheme();

  const url = getDocumentUrl(document.fileUrl);
  const extension = getFileExtension(document.fileUrl).toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "webp"].includes(extension);
  const isPdf = extension === "pdf";

  const openExternal = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open document.");
    }
  };

  if (isImage) {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: url }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (isPdf) {
    return (
      <WebView
        source={{ uri: url }}
        style={styles.webView}
        startInLoadingState
        renderLoading={() => (
          <View
            style={[
              styles.previewLoading,
              { backgroundColor: theme.background },
            ]}
          >
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.unsupportedPreview}>
      <Ionicons
        name="document-text-outline"
        size={56}
        color={theme.mutedText}
      />

      <Text style={[styles.unsupportedTitle, { color: theme.text }]}>
        Bu dosya türü önizlenemiyor.
      </Text>

      <Text style={[styles.unsupportedText, { color: theme.mutedText }]}>
        Dosyayı cihazdaki uygun uygulama ile açabilirsin.
      </Text>

      <Pressable
        onPress={openExternal}
        style={[styles.openExternalButton, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.openExternalButtonText}>Dosyayı Aç</Text>
      </Pressable>
    </View>
  );
}

function getDocumentUrl(fileUrl: string) {
  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  if (fileUrl.startsWith("/uploads")) {
    return `${API_ORIGIN}${fileUrl}`;
  }

  return `${API_ORIGIN}/uploads/documents/${fileUrl}`;
}

function getFileExtension(fileUrl: string) {
  const cleanUrl = fileUrl.split("?")[0];
  const extension = cleanUrl.split(".").pop();

  return extension ? extension.toUpperCase() : "FILE";
}

function getDocumentConfig(
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR");
}

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={accent} />
      <Text style={[styles.cardTitle, { color: theme.mutedText }]}>
        {title}
      </Text>
      <Text style={[styles.cardValue, { color: accent }]}>{value}</Text>
      <Text style={[styles.cardSub, { color: accent }]}>{sub}</Text>
    </View>
  );
}

function InfoCard({
  icon,
  title,
  line1,
  line2,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  line1: string;
  line2: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={theme.text} />
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.infoLine1, { color: theme.text }]}>{line1}</Text>
      {line2 ? (
        <Text style={[styles.infoLine2, { color: theme.mutedText }]}>
          {line2}
        </Text>
      ) : null}
    </View>
  );
}

function ServiceItem({
  service,
  currency,
}: {
  service: Service;
  currency: string;
}) {
  const { theme } = useAppTheme();

  const iconMap = {
    oil: "water-outline",
    brake: "disc-outline",
    filter: "options-outline",
    spark: "flash-outline",
    coolant: "battery-charging-outline",
  } as const;

  const iconName = iconMap[service.type ?? "oil"];

  return (
    <View
      style={[
        styles.serviceCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.serviceLeft}>
        <View
          style={[
            styles.serviceIconBox,
            {
              backgroundColor:
                theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
            },
          ]}
        >
          <Ionicons name={iconName} size={24} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.serviceTitle, { color: theme.text }]}>
            {service.title}
          </Text>

          <Text style={[styles.serviceMeta, { color: theme.mutedText }]}>
            {new Date(service.serviceDate).toLocaleDateString("tr-TR")} ·{" "}
            {service.km?.toLocaleString()} km
          </Text>
        </View>
      </View>

      <Text style={[styles.serviceCost, { color: theme.text }]}>
        {service.amount} {currency}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  hero: {
    height: 220,
    justifyContent: "flex-end",
  },
  heroImage: {
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  carName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  plate: {
    color: "#E5E7EB",
    marginTop: 4,
    fontWeight: "700",
  },
  kmBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  kmText: {
    fontWeight: "900",
  },
  tabs: {
    borderBottomWidth: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontWeight: "800",
    fontSize: 13,
  },
  grid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    minHeight: 128,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
  },
  cardValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "900",
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  infoLine1: {
    marginTop: 8,
    fontWeight: "900",
  },
  infoLine2: {
    marginTop: 4,
    fontWeight: "700",
  },
  tabContent: {
    padding: 16,
  },
  addButton: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  serviceCard: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  serviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  serviceMeta: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
  },
  serviceCost: {
    fontWeight: "900",
  },
  emptyTab: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  documentCard: {
    minHeight: 78,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  documentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  documentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  documentSubtitle: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
  },
  documentRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  documentType: {
    fontSize: 13,
    fontWeight: "900",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  webView: {
    flex: 1,
  },
  previewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  unsupportedPreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  unsupportedTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  unsupportedText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  openExternalButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  openExternalButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
});
