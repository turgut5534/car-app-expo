import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";
import { CarDetail } from "@/types/car";
import { API_URL } from "@/constants/api";

export default function VehiclesScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [vehicles, setVehicles] = useState<CarDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<CarDetail | null>(
    null,
  );
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const closeActionModal = () => {
    setActionModalVisible(false);
    setSelectedVehicle(null);
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/cars`, {
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

      const data: CarDetail[] = await response.json();

      setVehicles(data);
    } catch (err) {
      console.log(err);
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

  const deleteVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      setDeleting(true);

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/cars/${selectedVehicle.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setSelectedVehicle(null);
      fetchVehicles();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.mutedText }]}>
          {t("vehicles.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <Ionicons name="warning-outline" size={42} color="#DC2626" />
        <Text style={[styles.error, { color: theme.text }]}>
          {t("common.error")}
        </Text>
        <Text style={[styles.errorText, { color: theme.mutedText }]}>
          {error}
        </Text>

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={fetchVehicles}
        >
          <Text style={styles.retryText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("vehicles.title")}
        </Text>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/vehicles/create")}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t("vehicles.addCar")}</Text>
        </TouchableOpacity>

        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push(`/vehicles/${vehicle.id}`)}
          >
            {vehicle.photos?.length > 0 ? (
              vehicles.map((vehicle) => {
                const coverPhoto =
                  vehicle.photos?.find((photo) => photo.is_cover) ??
                  vehicle.photos?.[0];

                return (
                  <TouchableOpacity key={vehicle.id}>
                    {coverPhoto && (
                      <Image
                        source={{
                          uri: `${API_URL}/${coverPhoto.url}`,
                        }}
                        style={styles.vehicleImage}
                        resizeMode="contain"
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  {
                    backgroundColor:
                      theme.activeMode === "dark" ? "#1E293B" : "#F1F5F9",
                  },
                ]}
              >
                <Ionicons name="car-sport" size={48} color={theme.mutedText} />
              </View>
            )}

            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleName, { color: theme.text }]}>
                {vehicle.brand} {vehicle.model}
              </Text>

              <Text style={[styles.vehiclePlate, { color: theme.text }]}>
                {vehicle.plate}
              </Text>

              <View
                style={[
                  styles.kmBadge,
                  {
                    backgroundColor:
                      theme.activeMode === "dark" ? "#172554" : "#DBEAFE",
                  },
                ]}
              >
                <Text style={[styles.kmText, { color: theme.primary }]}>
                  {vehicle.owner?.distanceUnit === "mi"
                    ? `${Math.round((vehicle.currentKm ?? 0) * 0.621371)} mi`
                    : `${vehicle.currentKm ?? 0} km`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={(event) => {
                event.stopPropagation();
                setSelectedVehicle(vehicle);
                setActionModalVisible(true);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeActionModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeActionModal}>
          <Pressable
            style={[styles.actionSheet, { backgroundColor: theme.card }]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.actionTitle, { color: theme.text }]}>
              {selectedVehicle?.name ||
                `${selectedVehicle?.brand ?? ""} ${selectedVehicle?.model ?? ""}`}
            </Text>

            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                const id = selectedVehicle?.id;
                closeActionModal();
                router.push(`/vehicles/${id}/edit`);
              }}
            >
              <Ionicons name="create-outline" size={22} color={theme.text} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {t("common.edit")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                const id = selectedVehicle?.id;
                closeActionModal();
                router.push(`/vehicles/${id}`);
              }}
            >
              <Ionicons name="eye-outline" size={22} color={theme.text} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {t("common.viewDetails")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionModalVisible(false);
                setConfirmDeleteVisible(true);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
              <Text style={[styles.actionText, { color: "#DC2626" }]}>
                {t("common.delete")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeActionModal}
            >
              <Text style={[styles.cancelText, { color: theme.mutedText }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={confirmDeleteVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlayCenter}
          onPress={() => setConfirmDeleteVisible(false)}
        >
          <Pressable
            style={[styles.confirmBox, { backgroundColor: theme.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              {t("vehicles.confirmDelete")}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={{ color: theme.text }}>{t("common.no")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={deleting}
                onPress={() => {
                  setConfirmDeleteVisible(false);
                  deleteVehicle();
                }}
              >
                <Text style={{ color: "#DC2626", fontWeight: "700" }}>
                  {deleting ? t("common.loading") : t("common.yes")}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyFeature({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.emptyCardRow}>
      <Ionicons name={icon} size={22} color={theme.primary} />
      <Text style={[styles.emptyCardText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 22,
  },
  addButton: {
    height: 48,
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
    borderRadius: 10,
    marginBottom: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: "800",
  },
  vehiclePlate: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  kmBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  kmText: {
    fontSize: 13,
    fontWeight: "800",
  },
  moreButton: {
    alignSelf: "flex-start",
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontWeight: "600",
  },
  error: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 26,
    paddingHorizontal: 10,
  },
  emptyCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
  },
  emptyCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryEmptyButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 18,
  },
  actionItem: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    width: "85%",
    borderRadius: 18,
    padding: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 25,
    marginTop: 10,
  },
});
