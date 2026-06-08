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

const API_URL = "http://192.168.0.10:3000/vehicles";

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
        err instanceof Error ? err.message : t("common.somethingWentWrong")
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t("vehicles.title")}</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/vehicles/create")}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t("vehicles.addCar")}</Text>
        </TouchableOpacity>

        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={styles.vehicleCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/vehicles/${vehicle.id}`)}
          >
            {vehicle.imageUrl ? (
              <Image
                source={{ uri: vehicle.imageUrl }}
                style={styles.vehicleImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="car-sport" size={48} color="#94A3B8" />
              </View>
            )}

            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>

              <View style={styles.kmBadge}>
                <Text style={styles.kmText}>{vehicle.mileage}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
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
});

