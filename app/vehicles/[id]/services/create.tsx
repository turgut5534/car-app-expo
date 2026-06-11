import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../../../context/ThemeContext";
import { API_URL } from "@/constants/api";


export default function CreateServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [date, setDate] = useState(today);
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);

  type CarInfo = {
    id: string;
    brand: string;
    model: string;
    plate: string;
    imageUrl?: string;
    image?: string;
    currentKm: string;
  };

  const [cars, setCars] = useState<CarInfo[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(id);
  const [showCars, setShowCars] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);

  const selectedCar = cars.find((car) => car.id === selectedCarId);

  const fetchCars = async () => {
    try {
      setCarsLoading(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.loadFailed"));
      }

      const carList = Array.isArray(data) ? data : data?.cars || [];

      setCars(carList);

      const initialCarId = selectedCarId || carList[0]?.id;
      const initialCar = carList.find(
        (car: CarInfo) => car.id === initialCarId,
      );

      setMileageKm(initialCar.currentKm.toString());

      if (!selectedCarId && carList.length > 0) {
        setSelectedCarId(carList[0].id);
      }
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("profile.loadFailed"),
      );
    } finally {
      setCarsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const createService = async () => {
    if (!title.trim() || !mileageKm.trim() || !date.trim() || !cost.trim()) {
      Alert.alert(t("common.error"), t("services.fillAllFields"));
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId: selectedCarId,
          title: title.trim(),
          km: Number(mileageKm),
          serviceDate: date,
          amount: Number(cost),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("services.createFailed"));
      }

      router.replace(`/vehicles/${selectedCarId}` as any);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("services.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />

        <Text
          style={{
            color: theme.mutedText,
            marginTop: 12,
          }}
        >
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
              },
            ]}
          >
            <Ionicons
              name="construct-outline"
              size={56}
              color={theme.primary}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("services.createTitle")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("services.createSubtitle")}
          </Text>

          <View
            style={[
              styles.carSelectorWrapper,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                zIndex: 50,
                elevation: 50,
              },
            ]}
          >
            <Text style={[styles.label, { color: theme.text }]}>Araç</Text>

            <TouchableOpacity
              style={[
                styles.carSelector,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowCars(!showCars)}
              disabled={carsLoading}
            >
              {carsLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  {selectedCar?.imageUrl || selectedCar?.image ? (
                    <Image
                      source={{
                        uri: `${API_URL}/../uploads/cars/${selectedCar.imageUrl}`,
                      }}
                      style={styles.carImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.carImagePlaceholder,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      <Ionicons
                        name="car-outline"
                        size={22}
                        color={theme.mutedText}
                      />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.carTitle, { color: theme.text }]}>
                      {selectedCar
                        ? `${selectedCar.brand || ""} ${selectedCar.model || ""}`.trim()
                        : "Araç seç"}
                    </Text>

                    {selectedCar?.plate ? (
                      <Text
                        style={[styles.carSubtitle, { color: theme.mutedText }]}
                      >
                        {selectedCar.plate}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons
                    name={showCars ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.mutedText}
                  />
                </>
              )}
            </TouchableOpacity>

            {showCars && (
              <View
                style={[
                  styles.dropdownOverlay,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {cars.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.carDropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedCarId(item.id);
                      setShowCars(false);
                      setMileageKm(item.currentKm.toString());
                    }}
                  >
                    {item.imageUrl || item.image ? (
                      <Image
                        source={{
                          uri: `${API_URL}/../uploads/cars/${item.imageUrl}`,
                        }}
                        style={styles.carImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.carImagePlaceholder,
                          { backgroundColor: theme.background },
                        ]}
                      >
                        <Ionicons
                          name="car-outline"
                          size={22}
                          color={theme.mutedText}
                        />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.carTitle, { color: theme.text }]}>
                        {`${item.brand || ""} ${item.model || ""}`.trim() ||
                          "Araç"}
                      </Text>

                      {item.plate ? (
                        <Text
                          style={[
                            styles.carSubtitle,
                            { color: theme.mutedText },
                          ]}
                        >
                          {item.plate}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
            <Text style={[styles.label, { color: theme.text }]}>
              {t("services.serviceName")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={t("services.serviceNamePlaceholder")}
              placeholderTextColor={theme.mutedText}
            />

            <Text style={[styles.label, { color: theme.text }]}>
              {t("services.mileageKm")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={mileageKm}
              onChangeText={(text) => setMileageKm(text.replace(/[^0-9]/g, ""))}
              placeholder="145000"
              placeholderTextColor={theme.mutedText}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.text }]}>
              {t("services.date")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.mutedText}
            />

            <Text style={[styles.label, { color: theme.text }]}>
              {t("services.cost")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={cost}
              onChangeText={(text) => setCost(text.replace(/[^0-9.]/g, ""))}
              placeholder="75"
              placeholderTextColor={theme.mutedText}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
              loading && styles.disabledButton,
            ]}
            onPress={createService}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t("services.saveService")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 26,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 28,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  carInfoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  carInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  carInfoTitle: {
    fontSize: 16,
    fontWeight: "900",
  },

  carInfoPlate: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
  },
  carSelectorWrapper: {
    position: "relative",
    zIndex: 50,
    elevation: 50,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },

  dropdownOverlay: {
    position: "absolute",
    top: 92,
    left: 14,
    right: 14,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 999,
    elevation: 999,
  },

  carSelector: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  carDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  carImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },

  carImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  carTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  carSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },
});
