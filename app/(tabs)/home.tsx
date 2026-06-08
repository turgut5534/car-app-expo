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
  upcomingReminders: number;cars
  ownedCars: Car[];
  reminders: Reminder[];
};

const API_URL = "http://192.168.0.10:3000/dashboard/home";

export default function HomeScreen() {
  const { t } = useTranslation();

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
        await AsyncStorage.removeItem("token");
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
        err instanceof Error ? err.message : t("common.somethingWentWrong"),
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
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2563EB" />

          <Text style={styles.loadingTitle}>{t("common.loading")}</Text>

          <Text style={styles.loadingText}>{t("home.loadingDescription")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={42} color="#DC2626" />

          <Text style={styles.errorTitle}>{t("common.error")}</Text>

          <Text style={styles.errorText}>{error || t("home.fetchFailed")}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={fetchHomeData}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.smallTitle}>{t("home.title")}</Text>
            <Text style={styles.greeting}>{t("home.greeting")}</Text>
            <Text style={styles.name}>{data.userName} 👋</Text>
          </View>

          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t("home.totalCars")}</Text>
            <Text style={styles.cardValue}>{data.totalCars}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t("home.thisMonthExpenses")}</Text>
            <Text style={styles.greenText}>{data.thisMonthExpenses}</Text>
            <Text style={styles.subText}>
              ↑ {data.expenseChange} {t("home.vsLastMonth")}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t("home.upcomingReminders")}</Text>
            <Text style={styles.purpleText}>{data.upcomingReminders}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.myCars")}</Text>

          <TouchableOpacity>
            <Text style={styles.link}>{t("common.viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {data.ownedCars.length > 0 ? (
          data.cars.map((car) => (
            <View key={car.id} style={styles.carItem}>
              <View style={styles.carImagePlaceholder} />

              <View style={{ flex: 1 }}>
                <Text style={styles.carName}>{car.name}</Text>
                <Text style={styles.carPlate}>{car.plate}</Text>
              </View>

              <View>
                <Text style={styles.expenseLabel}>{t("home.thisMonth")}</Text>
                <Text style={styles.expenseValue}>{car.expense}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="car-sport-outline" size={42} color="#94A3B8" />

            <Text style={styles.emptyTitle}>{t("home.noCarsTitle")}</Text>

            <Text style={styles.emptyText}>{t("home.noCarsDescription")}</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t("home.upcomingRemindersTitle")}
          </Text>

          <TouchableOpacity>
            <Text style={styles.link}>{t("common.viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {data.reminders.length > 0 ? (
          data.reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>

              <Text style={styles.reminderCar}>{reminder.car}</Text>

              <Text style={styles.reminderDate}>{reminder.date}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-outline" size={42} color="#94A3B8" />

            <Text style={styles.emptyTitle}>{t("home.noRemindersTitle")}</Text>

            <Text style={styles.emptyText}>
              {t("home.noRemindersDescription")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#081331",
  },

  loadingText: {
    marginTop: 6,
    color: "#64748B",
    textAlign: "center",
  },

  errorCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#081331",
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 22,
    backgroundColor: "#2563EB",
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
    color: "#94A3B8",
    fontWeight: "600",
  },

  greeting: {
    fontSize: 16,
    color: "#64748B",
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  cardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563EB",
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
    color: "#2563EB",
    fontWeight: "600",
  },

  carItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },

  carImagePlaceholder: {
    width: 70,
    height: 40,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    marginRight: 12,
  },

  carName: {
    fontWeight: "700",
    fontSize: 16,
  },

  carPlate: {
    color: "#64748B",
    marginTop: 4,
  },

  expenseLabel: {
    fontSize: 11,
    color: "#64748B",
  },

  expenseValue: {
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 4,
  },

  reminderCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  reminderTitle: {
    fontWeight: "700",
  },

  reminderCar: {
    color: "#64748B",
    marginTop: 4,
  },

  reminderDate: {
    color: "#DC2626",
    marginTop: 8,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#081331",
    marginTop: 12,
  },

  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});
