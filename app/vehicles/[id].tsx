import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";

type Service = {
  id: string;
  title: string;
  date: string;
  mileageKm: number;
  cost: string;
  type?: "oil" | "brake" | "filter" | "spark" | "coolant";
  currency: string;
};

type CarDetail = {
  id: string;
  name: string;
  plate: string;
  imageUrl?: string;
  currentKm: number;
  monthlyExpenses: string;
  monthlyChangePercent: number;
  totalExpenses: string;
  services: Service[];
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

const API_URL = "http://192.168.0.10:3000/cars";

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchCar = async () => {
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
      });
    } catch {
      setCar(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCar();
  }, [id]);

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
            {activeTab === "services"
              ? t("cars.detailTitleServices")
              : t("cars.detailTitle")}
          </Text>

          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={{
            uri:
              car.imageUrl ||
              "https://images.unsplash.com/photo-1555215695-3004980ad54e",
          }}
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
                  currency={car.owner.currency}
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

        {activeTab !== "overview" && activeTab !== "services" ? (
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
    </SafeAreaView>
  );
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
            {service.km.toLocaleString()} km
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
});
