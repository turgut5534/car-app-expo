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
import { useAppTheme } from "../../../context/ThemeContext";
import { API_URL } from "@/constants/api";
import * as DocumentPicker from "expo-document-picker";
import { Decimal } from "@prisma/client/runtime/library";

export const SERVICE_CATEGORIES = [
  "OIL_CHANGE",
  "FILTER_CHANGE",
  "BRAKE",
  "TIRE",
  "BATTERY",
  "ENGINE",
  "TRANSMISSION",
  "SUSPENSION",
  "AC",
  "INSPECTION",
  "WASH",
  "OTHER",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export default function CreateServiceScreen() {
  const { carId } = useLocalSearchParams<{
    carId: string;
  }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const today = new Date().toISOString().split("T")[0];

  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [date, setDate] = useState(today);
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ServiceCategory>("OIL_CHANGE");
  const [showCategories, setShowCategories] = useState(false);

  const [attachments, setAttachments] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);

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
  const [selectedCarId, setSelectedCarId] = useState(carId);
  const [showCars, setShowCars] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);

  const selectedCar = cars.find((car) => car.id === selectedCarId);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: true,
    });

    if (!result.canceled) {
      setAttachments((prev) => [...prev, ...result.assets]);
    }
  };

  const formatDateForApi = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

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

      if (initialCar) {
        setMileageKm(initialCar.currentKm.toString());
      }

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
    if (
      (category === "OTHER" && !title.trim()) ||
      !mileageKm.trim() ||
      !date.trim()
    ) {
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

      const finalTitle =
        category === "OTHER"
          ? title.trim()
          : t(`serviceCategories.${category}`);
      const finalAmount = cost.trim() ? Number(cost) : 0;

      const formData = new FormData();

      formData.append("title", finalTitle.trim());
      formData.append("carId", selectedCarId);
      formData.append("km", String(Number(mileageKm)));
      formData.append("serviceDate", date);
      formData.append("amount", String(Number(finalAmount)));
      formData.append("category", category);
      formData.append("description", description);

      if (attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append("files", {
            uri: file.uri,
            name: file.name ?? "file",
            type: file.mimeType || "application/octet-stream",
          } as any);
        });
      }

      const response = await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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

  const isStep1Valid = !!selectedCarId && !!category;
  const isStep2Valid =
    category === "OTHER"
      ? !!title.trim() && !!mileageKm.trim() && !!date.trim()
      : !!mileageKm.trim() && !!date.trim();

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) {
      Alert.alert(t("common.error"), t("services.fillAllFields"));
      return;
    }
    if (step === 2 && !isStep2Valid) {
      Alert.alert(t("common.error"), t("services.fillAllFields"));
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
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
          contentContainerStyle={{ flexGrow: 1 }}
          nestedScrollEnabled={true}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.exitButton} onPress={router.back}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.stepIndicatorContainer}>
              <Text
                style={[styles.stepIndicatorText, { color: theme.primary }]}
              >
                {t("common.step")} {step}/3
              </Text>
            </View>
          </View>

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

          {/* =========================================
              ADIM 1: ARAÇ + KATEGORİ
             ========================================= */}
          {step === 1 && (
            <>
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
                <Text style={[styles.label, { color: theme.text }]}>
                  {t("services.vehicle")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.carSelector,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowCars(!showCars);
                    if (showCategories) setShowCategories(false);
                  }}
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
                            : t("services.selectVehicle")}
                        </Text>

                        {selectedCar?.plate ? (
                          <Text
                            style={[
                              styles.carSubtitle,
                              { color: theme.mutedText },
                            ]}
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
                          <Text
                            style={[styles.carTitle, { color: theme.text }]}
                          >
                            {`${item.brand || ""} ${item.model || ""}`.trim() ||
                              t("services.vehicleFallback")}
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
                    zIndex: 40, // Car dropdown'unun altında kalması için
                    elevation: 40,
                  },
                ]}
              >
                <Text style={[styles.label, { color: theme.text }]}>
                  {t("services.type")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.dropdownInput,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowCategories(!showCategories);
                    if (showCars) setShowCars(false);
                  }}
                >
                  <Text style={[styles.inputText, { color: theme.text }]}>
                    {t(`serviceCategories.${category}`)}
                  </Text>

                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={theme.mutedText}
                  />
                </TouchableOpacity>

                {showCategories && (
                  <View
                    style={[
                      styles.categoryDropdownOverlay,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={{ maxHeight: 240 }}
                    >
                      {SERVICE_CATEGORIES.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => {
                            setCategory(item);
                            setShowCategories(false);
                            if (item !== "OTHER") setTitle("");
                          }}
                        >
                          <Text
                            style={[styles.dropdownText, { color: theme.text }]}
                          >
                            {t(`serviceCategories.${item}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ÇÖZÜM: Kategori menüsü açıkken kaydırma payı yaratır */}
              {showCategories && <View style={{ height: 260 }} />}
            </>
          )}

          {/* =========================================
              ADIM 2: KM + TARİH
             ========================================= */}
          {step === 2 && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {category === "OTHER" && (
                <>
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
                </>
              )}

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
                onChangeText={(text) =>
                  setMileageKm(text.replace(/[^0-9]/g, ""))
                }
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
            </View>
          )}

          {/* =========================================
              ADIM 3: MALİYET + AÇIKLAMA + DOSYALAR
             ========================================= */}
          {step === 3 && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.label, { color: theme.text }]}>
                {t("services.cost")} ({t("common.optional")})
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
                placeholder="0"
                placeholderTextColor={theme.mutedText}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.label, { color: theme.text }]}>
                {t("services.description")} ({t("common.optional")})
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.text,
                    minHeight: 120,
                    textAlignVertical: "top",
                    paddingTop: 12,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={theme.mutedText}
                multiline
                numberOfLines={5}
              />

              <Text style={[styles.label, { color: theme.text }]}>
                {t("services.addFile")} ({t("common.optional")})
              </Text>

              <TouchableOpacity
                onPress={pickFile}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    justifyContent: "center",
                  },
                ]}
              >
                <Text
                  style={{
                    color: theme.text,
                    textAlign: "center",
                    fontWeight: "500",
                  }}
                >
                  {attachments.length > 0
                    ? `${attachments.length} ${t("services.filesSelected")}`
                    : t("services.addFile")}
                </Text>
              </TouchableOpacity>
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
                  {t("common.back")}
                </Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 },
                  ((step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid)) &&
                    styles.disabledButton,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>{t("common.next")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 },
                  loading && styles.disabledButton,
                ]}
                onPress={createService}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("services.saveService")}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
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

  card: {
    zIndex: 1,
    elevation: 1,
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
    justifyContent: "center",
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 28,
  },
  carSelectorWrapper: {
    zIndex: 3000,
    elevation: 3000,
    position: "relative",
  },
  dropdownOverlay: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
  },
  categoryDropdownOverlay: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
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
  inputText: {
    fontWeight: "600",
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontWeight: "600",
  },
  dropdownInput: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exitButton: {
    padding: 4,
  },
});
