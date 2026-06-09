import { useState, useEffect, useRef } from "react";
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
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../../context/ThemeContext";

const API_ORIGIN = "http://192.168.0.10:3000";
const API_URL = `${API_ORIGIN}/cars`;

type CarInfo = {
  id: string;
  brand?: string;
  model?: string;
  plate?: string;
  imageUrl?: string;
  image?: string;
};

export default function CreateFuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const today = new Date().toISOString().split("T")[0];

  const [liter, setLiter] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const [cars, setCars] = useState<CarInfo[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(id);
  const [showCars, setShowCars] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);

  const selectedCar = cars.find((car) => car.id === selectedCarId);

  const priceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PRICE_STEP = 0.01;

  const fetchCars = async () => {
    try {
      setCarsLoading(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.loadFailed"));
      }

      const carList = Array.isArray(data) ? data : data?.cars || [];

      setCars(carList);

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

  useEffect(() => {
    return () => {
      clearPriceTimers();
    };
  }, []);

  const clearPriceTimers = () => {
    if (priceTimeoutRef.current) {
      clearTimeout(priceTimeoutRef.current);
      priceTimeoutRef.current = null;
    }

    if (priceIntervalRef.current) {
      clearInterval(priceIntervalRef.current);
      priceIntervalRef.current = null;
    }
  };

  const changePrice = (direction: 1 | -1) => {
    setPricePerLiter((prev) => {
      const currentPrice = Number(prev || 0);
      const nextPrice = Math.max(0, currentPrice + direction * PRICE_STEP);
      const formattedPrice = nextPrice.toFixed(2);

      const literNumber = Number(liter);

      if (literNumber > 0) {
        setTotalCost((literNumber * nextPrice).toFixed(2));
      }

      return formattedPrice;
    });
  };

  const startChangingPrice = (direction: 1 | -1) => {
    clearPriceTimers();

    changePrice(direction);

    priceTimeoutRef.current = setTimeout(() => {
      priceIntervalRef.current = setInterval(() => {
        changePrice(direction);
      }, 70);
    }, 350);
  };

  const stopChangingPrice = () => {
    clearPriceTimers();
  };

  const createFuel = async () => {
    if (
      !liter.trim() ||
      !pricePerLiter.trim() ||
      !totalCost.trim() ||
      !mileageKm.trim() ||
      !date.trim()
    ) {
      Alert.alert(t("common.error"), t("fuel.fillAllFields"));
      return;
    }

    if (!selectedCarId) {
      Alert.alert(t("common.error"), t("fuel.selectCar"));
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/${selectedCarId}/fuel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          liter: Number(liter),
          pricePerLiter: Number(pricePerLiter),
          totalCost: Number(totalCost),
          km: Number(mileageKm),
          fuelDate: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("fuel.createFailed"));
      }

      router.replace(`/vehicles/${selectedCarId}` as any);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("fuel.createFailed"),
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

        <Text style={{ color: theme.mutedText, marginTop: 12 }}>
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
                  theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons name="water" size={56} color="#16A34A" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("fuel.createTitle")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("fuel.createSubtitle")}
          </Text>

          <View
            style={[
              styles.carSelectorWrapper,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: theme.text }]}>
              {t("cars.vehicle")}
            </Text>

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
                        uri: `${API_ORIGIN}/uploads/cars/${
                          selectedCar.imageUrl || selectedCar.image
                        }`,
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
                        ? `${selectedCar.brand || ""} ${
                            selectedCar.model || ""
                          }`.trim()
                        : t("cars.selectVehicle")}
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

            {showCars ? (
              <View
                style={[
                  styles.dropdown,
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
                    }}
                  >
                    {item.imageUrl || item.image ? (
                      <Image
                        source={{
                          uri: `${API_ORIGIN}/uploads/cars/${
                            item.imageUrl || item.image
                          }`,
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
                          t("cars.vehicle")}
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
            ) : null}
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
              {t("fuel.pricePerLiter")}
            </Text>

            <View
              style={[
                styles.priceStepper,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View>
                <Text
                  style={[styles.priceStepperLabel, { color: theme.mutedText }]}
                >
                  {t("fuel.pricePerLiter")}
                </Text>

                <Text style={[styles.priceStepperValue, { color: theme.text }]}>
                  {pricePerLiter || "0.00"}
                </Text>
              </View>

              <View style={styles.priceButtons}>
                <Pressable
                  style={[
                    styles.priceButton,
                    {
                      backgroundColor:
                        theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
                    },
                  ]}
                  onPressIn={() => startChangingPrice(1)}
                  onPressOut={stopChangingPrice}
                >
                  <Ionicons name="chevron-up" size={22} color="#16A34A" />
                </Pressable>

                <Pressable
                  style={[
                    styles.priceButton,
                    {
                      backgroundColor:
                        theme.activeMode === "dark" ? "#450A0A" : "#FEE2E2",
                    },
                  ]}
                  onPressIn={() => startChangingPrice(-1)}
                  onPressOut={stopChangingPrice}
                >
                  <Ionicons name="chevron-down" size={22} color="#DC2626" />
                </Pressable>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>
              {t("fuel.totalCost")}
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
              value={totalCost}
              onChangeText={(text) =>
                setTotalCost(text.replace(/[^0-9.]/g, ""))
              }
              placeholder="56.00"
              placeholderTextColor={theme.mutedText}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: theme.text }]}>
              {t("fuel.mileageKm")}
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
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
              loading && styles.disabledButton,
            ]}
            onPress={createFuel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t("fuel.saveFuel")}</Text>
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

  carSelectorWrapper: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
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

  dropdown: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 10,
    overflow: "hidden",
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
  priceStepper: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceStepperLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  priceStepperValue: {
    fontSize: 24,
    fontWeight: "900",
  },

  priceButtons: {
    flexDirection: "row",
    gap: 8,
  },

  priceButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
