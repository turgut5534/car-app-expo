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

  // Adım Yönetimi (1: Detaylar, 2: Dosya Ekleme)
  const [step, setStep] = useState(1);

  const [liter, setLiter] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("2.50");
  const [totalCost, setTotalCost] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [loading, setLoading] = useState(false);

  // Dosya Ekleme State'i
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

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
      const initialCar = carList.find((car: CarInfo) => car.id === initialCarId);

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

  const handleNextStep = () => {
    if (!pricePerLiter.trim() || !totalCost.trim() || !mileageKm.trim()) {
      Alert.alert(t("common.error"), t("fuel.fillAllFields"));
      return;
    }
    if (!selectedCarId) {
      Alert.alert(t("common.error"), t("fuel.selectCar"));
      return;
    }
    setStep(2);
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
          uri: Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
          name: file.name || `file_${index}`,
          type: file.mimeType || "application/octet-stream",
        };
        formData.append("files", fileObj as any);
      });

      const response = await fetch(`${API_URL}/fuels`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Multipart/form-data kullanırken Content-Type manuel set edilmez, cihaz otomatik sınır çizer.
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.mutedText, marginTop: 12 }}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backButton} onPress={() => step === 2 ? setStep(1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7" }]}>
            <Ionicons name={step === 1 ? "water" : "document-attach"} size={56} color="#16A34A" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {step === 1 ? t("fuel.createTitle") : t("fuel.attachmentsTitle", "Dosya Ekle")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {step === 1 ? t("fuel.createSubtitle") : t("fuel.attachmentsSubtitle", "Fatura veya makbuz yükleyebilirsiniz (Opsiyonel)")}
          </Text>

          {/* ADIM 1: DETAYLAR */}
          {step === 1 && (
            <View>
              <View style={[styles.carSelectorWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>{t("cars.vehicle")}</Text>
                <TouchableOpacity style={[styles.carSelector, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowCars(!showCars)} disabled={carsLoading}>
                  {carsLoading ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <>
                      {selectedCar?.imageUrl || selectedCar?.image ? (
                        <Image source={{ uri: `${API_URL}/uploads/cars/${selectedCar.imageUrl || selectedCar.image}` }} style={styles.carImage} />
                      ) : (
                        <View style={[styles.carImagePlaceholder, { backgroundColor: theme.background }]}>
                          <Ionicons name="car-outline" size={22} color={theme.mutedText} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.carTitle, { color: theme.text }]}>
                          {selectedCar ? `${selectedCar.brand || ""} ${selectedCar.model || ""}`.trim() : t("cars.selectVehicle")}
                        </Text>
                        {selectedCar?.plate && <Text style={[styles.carSubtitle, { color: theme.mutedText }]}>{selectedCar.plate}</Text>}
                      </View>
                      <Ionicons name={showCars ? "chevron-up" : "chevron-down"} size={18} color={theme.mutedText} />
                    </>
                  )}
                </TouchableOpacity>

                {showCars && (
                  <View style={[styles.dropdownOverlay, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {cars.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.carDropdownItem, { borderBottomColor: theme.border }]}
                        onPress={() => {
                          setSelectedCarId(item.id);
                          applyCarLastFuelPrice(item);
                          setMileageKm(item.currentKm.toString());
                          setShowCars(false);
                        }}
                      >
                        {item.imageUrl || item.image ? (
                          <Image source={{ uri: `${API_URL}/uploads/cars/${item.imageUrl || item.image}` }} style={styles.carImage} />
                        ) : (
                          <View style={[styles.carImagePlaceholder, { backgroundColor: theme.background }]}>
                            <Ionicons name="car-outline" size={22} color={theme.mutedText} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.carTitle, { color: theme.text }]}>{`${item.brand || ""} ${item.model || ""}`.trim() || t("cars.vehicle")}</Text>
                          {item.plate && <Text style={[styles.carSubtitle, { color: theme.mutedText }]}>{item.plate}</Text>}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>{t("fuel.pricePerLiter")}</Text>
                <View style={[styles.priceStepper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View>
                    <Text style={[styles.priceStepperLabel, { color: theme.mutedText }]}>{t("fuel.pricePerLiter")}</Text>
                    <Text style={[styles.priceStepperValue, { color: theme.text }]}>{pricePerLiter}</Text>
                  </View>
                  <View style={styles.priceButtons}>
                    <Pressable style={[styles.priceButton, { backgroundColor: theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7" }]} onPressIn={() => startChangingPrice(1)} onPressOut={stopChangingPrice}>
                      <Ionicons name="chevron-up" size={22} color="#16A34A" />
                    </Pressable>
                    <Pressable style={[styles.priceButton, { backgroundColor: theme.activeMode === "dark" ? "#450A0A" : "#FEE2E2" }]} onPressIn={() => startChangingPrice(-1)} onPressOut={stopChangingPrice}>
                      <Ionicons name="chevron-down" size={22} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>{t("fuel.totalCost")}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  value={totalCost}
                  onChangeText={(text) => setTotalCost(text.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                />

                <Text style={[styles.label, { color: theme.text }]}>{t("fuel.mileageKm")}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  value={mileageKm}
                  onChangeText={(text) => setMileageKm(text.replace(/[^0-9]/g, ""))}
                  placeholder="145000"
                  placeholderTextColor={theme.mutedText}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* ADIM 2: DOSYA EKLEME */}
          {step === 2 && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.text }]}>{t("fuel.addAttachments", "Belgeler / Resimler")}</Text>
              
              <TouchableOpacity style={[styles.uploadArea, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={pickFiles}>
                <Ionicons name="cloud-upload-outline" size={36} color={theme.primary} />
                <Text style={[styles.uploadText, { color: theme.text }]}>{t("fuel.selectFiles", "Dosyaları Seçmek İçin Dokunun")}</Text>
                <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 4 }}>{t("fuel.fileTypes", "Görsel veya PDF")}</Text>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View style={styles.fileList}>
                  {attachments.map((file, index) => (
                    <View key={index} style={[styles.fileRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <Ionicons name={file.mimeType?.startsWith("image/") ? "image-outline" : "document-text-outline"} size={20} color={theme.text} />
                      <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{file.name}</Text>
                      <TouchableOpacity onPress={() => removeAttachment(index)}>
                        <Ionicons name="close-circle" size={22} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* DİNAMİK NAVİGASYON BUTONLARI */}
          <View style={styles.actionButtonGroup}>
            {step === 2 && (
              <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setStep(1)}>
                <Text style={[styles.navButtonText, { color: theme.text }]}>{t("common.back", "Geri")}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                step === 2 ? styles.flexibleButton : { width: "100%" },
                { backgroundColor: theme.primary },
                loading && styles.disabledButton,
              ]}
              onPress={step === 1 ? handleNextStep : createFuel}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === 1 ? t("common.next", "İleri") : t("fuel.saveFuel")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backButton: { marginTop: 8, marginBottom: 20 },
  iconCircle: { width: 112, height: 112, borderRadius: 56, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  subtitle: { textAlign: "center", lineHeight: 22, marginBottom: 26 },
  carSelectorWrapper: { position: "relative", zIndex: 50, elevation: 50, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 18 },
  dropdownOverlay: { position: "absolute", top: 92, left: 14, right: 14, borderWidth: 1, borderRadius: 14, overflow: "hidden", zIndex: 999, elevation: 999 },
  carSelector: { minHeight: 64, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  carDropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  carImage: { width: 44, height: 44, borderRadius: 10 },
  carImagePlaceholder: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  carTitle: { fontSize: 15, fontWeight: "800" },
  carSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "600" },
  card: { borderWidth: 1, borderRadius: 18, padding: 18 },
  label: { fontSize: 13, fontWeight: "700", marginTop: 12, marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  button: { height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  priceStepper: { minHeight: 68, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyBox: "center", justifyContent: "space-between" },
  priceStepperLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  priceStepperValue: { fontSize: 24, fontWeight: "900" },
  priceButtons: { flexDirection: "row", gap: 8 },
  priceButton: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  
  // Yeni Eklenen Stiller (Aşamalı Tasarım İçin)
  uploadArea: { borderStyle: "dashed", borderWidth: 2, borderRadius: 14, padding: 24, alignItems: "center", justifyContent: "center", marginTop: 8 },
  uploadText: { fontSize: 14, fontWeight: "700", marginTop: 10 },
  fileList: { marginTop: 16, gap: 10 },
  fileRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  fileName: { flex: 1, fontSize: 14, fontWeight: "500" },
  actionButtonGroup: { flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 28 },
  navButton: { flex: 1, height: 56, borderRadius: 14, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  navButtonText: { fontSize: 16, fontWeight: "800" },
  flexibleButton: { flex: 1.5 }
});