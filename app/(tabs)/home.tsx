import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";

type Car = {
  id: string;
  name: string;
  plate: string;
  expense: string;
};

type Reminder = {
  id: string;
  title: string;
  car: string;
  date: string;
};

type HomeData = {
  userName: string;
  totalCars: number;
  thisMonthExpenses: string;
  expenseChange: string;
  upcomingReminders: number;
  ownedCars: Car[];
  reminders: Reminder[];
};

const API_URL = "http://192.168.0.10:3000/dashboard/home";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem("accessToken");
        router.replace("/(auth)/login");
        return;
      }

      if (!response.ok) {
        throw new Error(t("home.fetchFailed"));
      }

      const result: HomeData = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("common.somethingWentWrong")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.loadingCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />

          <Text style={[styles.loadingTitle, { color: theme.text }]}>
            {t("common.loading")}
          </Text>

          <Text style={[styles.loadingText, { color: theme.mutedText }]}>
            {t("home.loadingDescription")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="warning-outline" size={42} color="#DC2626" />

          <Text style={[styles.errorTitle, { color: theme.text }]}>
            {t("common.error")}
          </Text>

          <Text style={[styles.errorText, { color: theme.mutedText }]}>
            {error || t("home.fetchFailed")}
          </Text>

          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchHomeData}
          >
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.smallTitle, { color: theme.mutedText }]}>
              {t("home.title")}
            </Text>

            <Text style={[styles.greeting, { color: theme.mutedText }]}>
              {t("home.greeting")}
            </Text>

            <Text style={[styles.name, { color: theme.text }]}>
              {data.userName} 👋
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.notificationButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.mutedText }]}>
              {t("home.totalCars")}
            </Text>
            <Text style={[styles.cardValue, { color: theme.primary }]}>
              {data.totalCars}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.mutedText }]}>
              {t("home.thisMonthExpenses")}
            </Text>
            <Text style={styles.greenText}>{data.thisMonthExpenses}</Text>
            <Text style={styles.subText}>
              ↑ {data.expenseChange} {t("home.vsLastMonth")}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.mutedText }]}>
              {t("home.upcomingReminders")}
            </Text>
            <Text style={styles.purpleText}>{data.upcomingReminders}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("home.myCars")}
          </Text>

          <TouchableOpacity onPress={() => router.push("/vehicles")}>
            <Text style={[styles.link, { color: theme.primary }]}>
              {t("common.viewAll")}
            </Text>
          </TouchableOpacity>
        </View>

        {data.ownedCars.length > 0 ? (
          data.ownedCars.map((car) => (
            <View
              key={car.id}
              style={[
                styles.carItem,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.carImagePlaceholder,
                  {
                    backgroundColor:
                      theme.activeMode === "dark" ? "#1E293B" : "#E2E8F0",
                  },
                ]}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={32}
                  color={theme.mutedText}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.carName, { color: theme.text }]}>
                  {car.name}
                </Text>
                <Text style={[styles.carPlate, { color: theme.mutedText }]}>
                  {car.plate}
                </Text>
              </View>

              <View>
                <Text style={[styles.expenseLabel, { color: theme.mutedText }]}>
                  {t("home.thisMonth")}
                </Text>
                <Text style={[styles.expenseValue, { color: theme.primary }]}>
                  {car.expense}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyCard
            icon="car-sport-outline"
            title={t("home.noCarsTitle")}
            description={t("home.noCarsDescription")}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("home.upcomingRemindersTitle")}
          </Text>

          <TouchableOpacity>
            <Text style={[styles.link, { color: theme.primary }]}>
              {t("common.viewAll")}
            </Text>
          </TouchableOpacity>
        </View>

        {data.reminders.length > 0 ? (
          data.reminders.map((reminder) => (
            <View
              key={reminder.id}
              style={[
                styles.reminderCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.reminderTitle, { color: theme.text }]}>
                {reminder.title}
              </Text>

              <Text style={[styles.reminderCar, { color: theme.mutedText }]}>
                {reminder.car}
              </Text>

              <Text style={styles.reminderDate}>{reminder.date}</Text>
            </View>
          ))
        ) : (
          <EmptyCard
            icon="notifications-outline"
            title={t("home.noRemindersTitle")}
            description={t("home.noRemindersDescription")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.emptyCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Ionicons name={icon} size={42} color={theme.mutedText} />

      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>

      <Text style={[styles.emptyText, { color: theme.mutedText }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingCard: {
    width: "100%",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
  },

  loadingText: {
    marginTop: 6,
    textAlign: "center",
  },

  errorCard: {
    width: "100%",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 22,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: "600",
  },

  greeting: {
    fontSize: 16,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
  },

  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardLabel: {
    fontSize: 12,
  },

  cardValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },

  greenText: {
    color: "#16A34A",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },

  purpleText: {
    color: "#8B5CF6",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },

  subText: {
    color: "#16A34A",
    fontSize: 11,
    marginTop: 6,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  link: {
    fontWeight: "600",
  },

  carItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },

  carImagePlaceholder: {
    width: 70,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  carName: {
    fontWeight: "700",
    fontSize: 16,
  },

  carPlate: {
    marginTop: 4,
  },

  expenseLabel: {
    fontSize: 11,
  },

  expenseValue: {
    fontWeight: "700",
    marginTop: 4,
  },

  reminderCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },

  reminderTitle: {
    fontWeight: "700",
  },

  reminderCar: {
    marginTop: 4,
  },

  reminderDate: {
    color: "#DC2626",
    marginTop: 8,
    fontWeight: "600",
  },

  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});