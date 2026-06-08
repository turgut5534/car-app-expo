import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  mileage: string;
  imageUrl?: string;
};

const API_URL = "http://192.168.0.10:3000/cars";

export default function VehiclesScreen() {
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(API_URL, {
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
        throw new Error(t("vehicles.fetchFailed"));
      }

      const data: Vehicle[] = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("common.somethingWentWrong"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0057E7" />
        <Text style={styles.loadingText}>{t("vehicles.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="warning-outline" size={42} color="#DC2626" />
        <Text style={styles.error}>{t("common.error")}</Text>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={fetchVehicles}>
          <Text style={styles.retryText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="car-sport" size={64} color="#0057E7" />
          </View>

          <Text style={styles.emptyTitle}>{t("vehicles.noVehicles")}</Text>

          <Text style={styles.emptyDescription}>
            {t("vehicles.noVehiclesDescription")}
          </Text>

          <View style={styles.emptyCard}>
            <View style={styles.emptyCardRow}>
              <Ionicons name="speedometer-outline" size={22} color="#0057E7" />
              <Text style={styles.emptyCardText}>
                {t("vehicles.trackMileage")}
              </Text>
            </View>

            <View style={styles.emptyCardRow}>
              <Ionicons name="construct-outline" size={22} color="#0057E7" />
              <Text style={styles.emptyCardText}>
                {t("vehicles.trackMaintenance")}
              </Text>
            </View>

            <View style={styles.emptyCardRow}>
              <Ionicons name="cash-outline" size={22} color="#0057E7" />
              <Text style={styles.emptyCardText}>
                {t("vehicles.trackExpenses")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryEmptyButton}
            onPress={() => router.push("/vehicles/create")}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.primaryEmptyButtonText}>
              {t("vehicles.addFirstVehicle")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#081331",
    marginTop: 10,
    marginBottom: 22,
  },
  addButton: {
    height: 48,
    backgroundColor: "#0057E7",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  vehicleCard: {
    minHeight: 112,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  vehicleImage: {
    width: 120,
    height: 72,
    marginRight: 14,
  },
  imagePlaceholder: {
    width: 120,
    height: 72,
    marginRight: 14,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  vehiclePlate: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  kmBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  kmText: {
    color: "#0057E7",
    fontSize: 13,
    fontWeight: "800",
  },
  moreButton: {
    alignSelf: "flex-start",
    padding: 4,
  },
  center: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  error: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#0057E7",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyWrapper: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 6,
},

emptyIconCircle: {
  width: 132,
  height: 132,
  borderRadius: 66,
  backgroundColor: "#EEF4FF",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 24,
},

emptyTitle: {
  fontSize: 24,
  fontWeight: "900",
  color: "#081331",
  textAlign: "center",
},

emptyDescription: {
  fontSize: 15,
  color: "#64748B",
  textAlign: "center",
  lineHeight: 22,
  marginTop: 10,
  marginBottom: 26,
  paddingHorizontal: 10,
},

emptyCard: {
  width: "100%",
  backgroundColor: "#F8FAFC",
  borderRadius: 18,
  padding: 18,
  marginBottom: 26,
  borderWidth: 1,
  borderColor: "#E2E8F0",
},

emptyCardRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingVertical: 10,
},

emptyCardText: {
  color: "#081331",
  fontSize: 15,
  fontWeight: "700",
},

primaryEmptyButton: {
  width: "100%",
  height: 56,
  borderRadius: 16,
  backgroundColor: "#0057E7",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},

primaryEmptyButtonText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "800",
},
});
