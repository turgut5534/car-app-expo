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
import * as DocumentPicker from "expo-document-picker";
import { useAppTheme } from "../../../context/ThemeContext";
import { API_URL } from "@/constants/api";

type CarInfo = {
  id: string;
  brand?: string;
  model?: string;
  plate?: string;
  imageUrl?: string;
  image?: string;
  lastFuelPricePerLiter?: number | string | null;
  currentKm: string;
};

export default function CreateFuelScreen() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  // Toplam adım sayısını 3'e çıkardık
  const [step, setStep] = useState(1);

  const [liter, setLiter] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("2.50");
  const [totalCost, setTotalCost] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [loading, setLoading] = useState(false);

  // Dosya Ekleme State'i
  const [attachments, setAttachments] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);

  const [cars, setCars] = useState<CarInfo[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(carId);
  const [showCars, setShowCars] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);

  const selectedCar = cars.find((car) => car.id === selectedCarId);

  // Fiyat veya Maliyet değiştiğinde Litre miktarını otomatik hesapla
  useEffect(() => {
    const cost = Number(totalCost);
    const price = Number(pricePerLiter);
    if (cost > 0 && price > 0) {
      setLiter((cost / price).toFixed(2));
    } else {
      setLiter("");
    }
  }, [totalCost, pricePerLiter]);

  const applyCarLastFuelPrice = (car?: CarInfo) => {
    if (!car?.lastFuelPricePerLiter) {
      setPricePerLiter("2.50");
      return;
    }
    setMileageKm(car.currentKm.toString());
    setPricePerLiter(Number(car.lastFuelPricePerLiter).toFixed(2));
  };

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

      const response = await fetch(`${API_URL}/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t("profile.loadFailed"));
      }

      const carList = Array.isArray(data) ? data : data?.cars || [];
      setCars(carList);

      const initialCarId = selectedCarId || carList[0]?.id;
      const initialCar = carList.find(
        (car: CarInfo) => car.id === initialCarId
      );

      if (initialCarId) {
        setSelectedCarId(initialCarId);
      }

      if (initialCar) {
        applyCarLastFuelPrice(initialCar);
        setMileageKm(initialCar.currentKm.toString());
      }
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("profile.loadFailed")
      );
    } finally {
      setCarsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    return () => clearPriceTimers();
  }, []);

  const clearPriceTimers = () => {
    if (priceTimeoutRef.current) clearTimeout(priceTimeoutRef.current);
    if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    priceTimeoutRef.current = null;
    priceIntervalRef.current = null;
  };

  const changePrice = (direction: 1 | -1) => {
    setPricePerLiter((prev) => {
      const currentPrice = Number(prev || 0);
      const nextPrice = Math.max(0, currentPrice + direction * PRICE_STEP);
      return nextPrice.toFixed(2);
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

  const stopChangingPrice = () => clearPriceTimers();

  // Çoklu Dosya Seçici Fonksiyon
  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setAttachments((prev) => [...prev, ...result.assets]);
      }
    } catch {
      Alert.alert(t("common.error"), "File selection failed");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!pricePerLiter.trim() || !totalCost.trim() || !mileageKm.trim()) {
        Alert.alert(t("common.error"), t("fuel.fillAllFields"));
        return;
      }
      if (!selectedCarId) {
        Alert.alert(t("common.error"), t("fuel.selectCar"));
        return;
      }
    }
    
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const createFuel = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      // FormData Hazırlığı
      const formData = new FormData();
      formData.append("carId", selectedCarId || "");
      formData.append("liter", String(liter));
      formData.append("pricePerLiter", String(pricePerLiter));
      formData.append("totalAmount", String(totalCost));
      formData.append("km", String(mileageKm));

      attachments.forEach((file, index) => {
        const fileObj = {
          uri:
            Platform.OS === "android"
              ? file.uri
              : file.uri.replace("file://", ""),
          name: file.name || `file_${index}`,
          type: file.mimeType || "application/octet-stream",
        };
        formData.append("files", fileObj as any);
      });

      const response = await fetch(`${API_URL}/fuels`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("fuel.createFailed"));
      }

      router.replace(`/vehicles/${selectedCarId}` as any);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("fuel.createFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = () => {
    if (step === 1) return "water";
    if (step === 2) return "document-attach";
    return "list-outline";
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
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* =========================================
              HEADER & STEP INDICATOR
             ========================================= */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.exitButton} onPress={router.back}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.stepIndicatorContainer}>
              <Text
                style={[styles.stepIndicatorText, { color: theme.primary }]}
              >
                {t("common.step", { defaultValue: "Adım" })} {step}/3
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons name={getStepIcon()} size={56} color="#16A34A" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {step === 3
              ? t("common.summary", { defaultValue: "Özet" })
              : step === 1
              ? t("fuel.createTitle")
              : t("fuel.attachmentsTitle", { defaultValue: "Dosya Ekle" })}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {step === 3
              ? t("fuel.checkDetailsBeforeSaving", { defaultValue: "Kaydetmeden önce detayları kontrol edin." })
              : step === 1
              ? t("fuel.createSubtitle")
              : t("fuel.attachmentsSubtitle", { defaultValue: "Fatura veya makbuz yükleyebilirsiniz (Opsiyonel)" })}
          </Text>

          {/* =========================================
              ADIM 1: DETAYLAR
             ========================================= */}
          {step === 1 && (
            <View>
              <View
                style={[
                  styles.carSelectorWrapper,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
                  {t("cars.vehicle")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.carSelector,
                    { backgroundColor: theme.card, borderColor: theme.border },
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
                            uri: `${API_URL}/uploads/cars/${
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
                        {selectedCar?.plate && (
                          <Text
                            style={[
                              styles.carSubtitle,
                              { color: theme.mutedText },
                            ]}
                          >
                            {selectedCar.plate}
                          </Text>
                        )}
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
                          applyCarLastFuelPrice(item);
                          setMileageKm(item.currentKm.toString());
                          setShowCars(false);
                        }}
                      >
                        {item.imageUrl || item.image ? (
                          <Image
                            source={{
                              uri: `${API_URL}/uploads/cars/${
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
                          <Text
                            style={[styles.carTitle, { color: theme.text }]}
                          >
                            {`${item.brand || ""} ${item.model || ""}`.trim() ||
                              t("cars.vehicle")}
                          </Text>
                          {item.plate && (
                            <Text
                              style={[
                                styles.carSubtitle,
                                { color: theme.mutedText },
                              ]}
                            >
                              {item.plate}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
                  {t("fuel.pricePerLiter")}
                </Text>
                <View
                  style={[
                    styles.priceStepper,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.priceStepperLabel,
                        { color: theme.mutedText },
                      ]}
                    >
                      {t("fuel.pricePerLiter")}
                    </Text>
                    <Text
                      style={[
                        styles.priceStepperValue,
                        { color: theme.text },
                      ]}
                    >
                      {pricePerLiter}
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
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.mutedText}
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
                  onChangeText={(text) =>
                    setMileageKm(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="145000"
                  placeholderTextColor={theme.mutedText}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* =========================================
              ADIM 2: DOSYA EKLEME (Opsiyonel)
             ========================================= */}
          {step === 2 && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
                {t("fuel.addAttachments", { defaultValue: "Belgeler / Resimler" })}
              </Text>

              <TouchableOpacity
                style={[
                  styles.uploadArea,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                onPress={pickFiles}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={36}
                  color={theme.primary}
                />
                <Text style={[styles.uploadText, { color: theme.text }]}>
                  {t("fuel.selectFiles", { defaultValue: "Dosyaları Seçmek İçin Dokunun" })}
                </Text>
                <Text
                  style={{
                    color: theme.mutedText,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {t("fuel.fileTypes", { defaultValue: "Görsel veya PDF" })}
                </Text>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View style={styles.fileList}>
                  {attachments.map((file, index) => (
                    <View
                      key={index}
                      style={[
                        styles.fileRow,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          file.mimeType?.startsWith("image/")
                            ? "image-outline"
                            : "document-text-outline"
                        }
                        size={20}
                        color={theme.text}
                      />
                      <Text
                        style={[styles.fileName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      <TouchableOpacity onPress={() => removeAttachment(index)}>
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color="#DC2626"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* =========================================
              ADIM 3: ÖZET
             ========================================= */}
          {step === 3 && (
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <SummaryRow
                theme={theme}
                label={t("cars.vehicle")}
                value={
                  selectedCar
                    ? `${selectedCar.brand || ""} ${selectedCar.model || ""}`.trim()
                    : "-"
                }
              />
              <SummaryRow
                theme={theme}
                label={t("fuel.pricePerLiter")}
                value={`${pricePerLiter}`}
              />
              <SummaryRow
                theme={theme}
                label={t("fuel.totalCost")}
                value={`${totalCost}`}
              />
              <SummaryRow
                theme={theme}
                label={t("common.liter", { defaultValue: "Litre" })}
                value={`${liter} L`}
              />
              <SummaryRow
                theme={theme}
                label={t("fuel.mileageKm")}
                value={`${mileageKm} km`}
              />
              <SummaryRow
                theme={theme}
                label={t("fuel.addAttachments", { defaultValue: "Eklenen Dosyalar" })}
                value={
                  attachments.length > 0
                    ? `${attachments.length} ${t("services.filesSelected", { defaultValue: "dosya" })}`
                    : t("common.none", { defaultValue: "Eklenmedi" })
                }
                isLast
              />
            </View>
          )}

          {/* =========================================
              NAVİGASYON BUTONLARI (İLERİ/GERİ/KAYDET)
             ========================================= */}
          <View style={styles.navigationButtons}>
            {step > 1 && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.backNavButton,
                  { borderColor: theme.border },
                ]}
                onPress={handleBack}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  {t("common.back", { defaultValue: "Geri" })}
                </Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 },
                ]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>
                  {t("common.next", { defaultValue: "İleri" })}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 },
                  loading && styles.disabledButton,
                ]}
                onPress={createFuel}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("fuel.saveFuel")}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Özet görünümü için yardımcı bileşen
function SummaryRow({
  theme,
  label,
  value,
  isLast = false,
}: {
  theme: any;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
        {label}
      </Text>
      <Text
        style={[styles.summaryValue, { color: theme.text }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  exitButton: {
    padding: 4,
  },
  stepIndicatorContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepIndicatorText: {
    fontWeight: "700",
    fontSize: 14,
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
    marginTop: 8,
  },
  carDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carImage: { width: 44, height: 44, borderRadius: 10 },
  carImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  carTitle: { fontSize: 15, fontWeight: "800" },
  carSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "600" },
  card: { borderWidth: 1, borderRadius: 18, padding: 18 },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "800",
    flex: 2,
    textAlign: "right",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
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
  priceStepperLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  priceStepperValue: { fontSize: 24, fontWeight: "900" },
  priceButtons: { flexDirection: "row", gap: 8 },
  priceButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadArea: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  uploadText: { fontSize: 14, fontWeight: "700", marginTop: 10 },
  fileList: { marginTop: 16, gap: 10 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  fileName: { flex: 1, fontSize: 14, fontWeight: "500" },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  backNavButton: {
    borderWidth: 1,
    flex: 0.4,
    backgroundColor: "transparent",
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});