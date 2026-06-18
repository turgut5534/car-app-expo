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
import * as DocumentPicker from "expo-document-picker";
import { useAppTheme } from "../../../context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_URL } from "@/constants/api";
import { CarDetail } from "@/types/car";

type DocumentType =
  | "REGISTRATION"
  | "INSURANCE"
  | "INSPECTION"
  | "INVOICE"
  | "SERVICE_REPORT"
  | "PURCHASE_INVOICE"
  | "ROADSIDE_ASSISTANCE"
  | "OTHER";

const documentTypes: DocumentType[] = [
  "REGISTRATION",
  "INSURANCE",
  "INSPECTION",
  "INVOICE",
  "SERVICE_REPORT",
  "PURCHASE_INVOICE",
  "ROADSIDE_ASSISTANCE",
  "OTHER",
];

export default function CreateDocumentScreen() {
  const { carId } = useLocalSearchParams<{
    carId: string;
  }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocumentType>("REGISTRATION");
  const [expiresAt, setExpiresAt] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<CarDetail[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(carId);
  const [showCars, setShowCars] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);
  const selectedCar = cars.find((car) => car.id === selectedCarId);

  useEffect(() => {
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
          throw new Error(data?.message || "Araçlar yüklenemedi");
        }

        const carList = Array.isArray(data) ? data : data?.cars || [];
        setCars(carList);

        if (!selectedCarId && carList.length > 0) {
          setSelectedCarId(carList[0].id);
        }
      } catch (error) {
        Alert.alert(
          t("common.error"),
          error instanceof Error ? error.message : "Araçlar yüklenemedi",
        );
      } finally {
        setCarsLoading(false);
      }
    };

    fetchCars();
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return t("documents.noExpirationDate");

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const formatDateForApi = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (!result.canceled) {
      setFiles(result.assets);
    }
  };

  const handleNext = () => {
    if (step === 1 && type === "OTHER" && !title.trim()) {
      Alert.alert(
        t("common.error"),
        t("documents.fillTitle", {
          defaultValue: "Lütfen belge başlığını girin.",
        }),
      );
      return;
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

  const createDocument = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const formData = new FormData();

      formData.append("type", type);
      formData.append("carId", selectedCarId);

      if (type === "OTHER" && title.trim() !== "") {
        formData.append("title", title.trim());
      } else {
        setTitle(type);
      }

      if (expiresAt) {
        formData.append("expiresAt", formatDateForApi(expiresAt));
      }

      files.forEach((file) => {
        formData.append("files", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);
      });

      const response = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data?.message || t("documents.createFailed"));
      }

      router.replace(`/vehicles/${selectedCarId}`);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("documents.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // İkonu adıma göre değiştir
  const getStepIcon = () => {
    if (step === 1) return "document-text-outline";
    if (step === 2) return "cloud-upload-outline";
    return "list-outline";
  };

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
                  theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
              },
            ]}
          >
            <Ionicons name={getStepIcon()} size={56} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {step === 3
              ? t("common.summary", { defaultValue: "Özet" })
              : t("documents.createTitle")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {step === 3
              ? t("documents.checkDetailsBeforeSaving", {
                  defaultValue:
                    "Kaydetmeden önce belge detaylarını kontrol edin.",
                })
              : t("documents.createSubtitle")}
          </Text>

          {/* =========================================
              ADIM 1: ARAÇ, TÜR ve TARİH
             ========================================= */}
          {step === 1 && (
            <View style={styles.stepContainer}>
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
                <Text
                  style={[styles.label, { color: theme.text, marginTop: 0 }]}
                >
                  {t("documents.car", { defaultValue: "Araç" })}
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
                      {selectedCar?.photos ? (
                        <Image
                          source={{
                            uri: `${API_URL}/../uploads/cars/${selectedCar.photos[0].fileName}`,
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
                            : t("documents.selectCar", {
                                defaultValue: "Araç seç",
                              })}
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
                    {cars.map((car) => (
                      <TouchableOpacity
                        key={car.id}
                        style={[
                          styles.carDropdownItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => {
                          setSelectedCarId(car.id);
                          setShowCars(false);
                        }}
                      >
                        {car.photos ? (
                          <Image
                            source={{
                              uri: `${API_URL}/../uploads/cars/${car.photos[0].fileName}`,
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
                            {`${car.brand || ""} ${car.model || ""}`.trim() ||
                              t("documents.car", { defaultValue: "Araç" })}
                          </Text>

                          {car.plate ? (
                            <Text
                              style={[
                                styles.carSubtitle,
                                { color: theme.mutedText },
                              ]}
                            >
                              {car.plate}
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
                <Text
                  style={[styles.label, { color: theme.text, marginTop: 0 }]}
                >
                  {t("documents.type")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setShowTypes(!showTypes)}
                >
                  <Text style={[styles.inputText, { color: theme.text }]}>
                    {t(`documentTypes.${type}`)}
                  </Text>

                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={theme.mutedText}
                  />
                </TouchableOpacity>

                {showTypes && (
                  <View
                    style={[
                      styles.dropdownOverlayType,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <ScrollView nestedScrollEnabled>
                      {documentTypes.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => {
                            setType(item);
                            setShowTypes(false);
                            if (item !== "OTHER") setTitle("");
                          }}
                        >
                          <Text
                            style={[styles.dropdownText, { color: theme.text }]}
                          >
                            {t(`documentTypes.${item}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* EĞER "OTHER" SEÇİLİYSE BAŞLIK ALANI AÇILIR */}
                {type === "OTHER" && (
                  <>
                    <Text style={[styles.label, { color: theme.text }]}>
                      {t("documents.title", { defaultValue: "Belge Başlığı" })}
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
                      placeholder={t("documents.titlePlaceholder", {
                        defaultValue: "Belge adı girin...",
                      })}
                      placeholderTextColor={theme.mutedText}
                    />
                  </>
                )}

                <Text style={[styles.label, { color: theme.text }]}>
                  {t("documents.expiresAt")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={{
                      color: expiresAt ? theme.text : theme.mutedText,
                      fontWeight: "600",
                    }}
                  >
                    {formatDate(expiresAt)}
                  </Text>

                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.mutedText}
                  />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={expiresAt ?? new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setExpiresAt(selectedDate);
                      }
                    }}
                  />
                )}

                {expiresAt ? (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => setExpiresAt(null)}
                  >
                    <Text
                      style={[styles.clearDateText, { color: theme.mutedText }]}
                    >
                      {t("documents.clearExpirationDate")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}

          {/* =========================================
              ADIM 2: DOSYA YÜKLEME (Opsiyonel)
             ========================================= */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.optionalLabelRow}>
                  <Text
                    style={[styles.label, { color: theme.text, marginTop: 0 }]}
                  >
                    {t("documents.file")}
                  </Text>
                  <Text
                    style={[styles.optionalText, { color: theme.mutedText }]}
                  >
                    {t("documents.optional", {
                      defaultValue: "(İsteğe Bağlı)",
                    })}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.fileBox,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={pickFile}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={28}
                    color={theme.primary}
                  />

                  <View style={{ flex: 1 }}>
                    {files.length > 0 ? (
                      files.map((file, index) => (
                        <Text
                          key={index}
                          style={[styles.fileTitle, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          • {file.name}
                        </Text>
                      ))
                    ) : (
                      <Text style={[styles.fileTitle, { color: theme.text }]}>
                        {t("documents.chooseFile")}
                      </Text>
                    )}

                    <Text
                      style={[styles.fileSubtitle, { color: theme.mutedText }]}
                    >
                      {t("documents.fileHint")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
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
                label={t("documents.car", { defaultValue: "Araç" })}
                value={
                  selectedCar
                    ? `${selectedCar.brand || ""} ${selectedCar.model || ""}`.trim()
                    : "-"
                }
              />
              <SummaryRow
                theme={theme}
                label={t("documents.type")}
                value={
                  type === "OTHER" && title ? title : t(`documentTypes.${type}`)
                }
              />
              <SummaryRow
                theme={theme}
                label={t("documents.expiresAt")}
                value={formatDate(expiresAt)}
              />
              <SummaryRow
                theme={theme}
                label={t("documents.file")}
                value={
                  files.length > 0
                    ? `${files.length} file(s)`
                    : t("common.none", { defaultValue: "Not added" })
                }
                isLast
              />
            </View>
          )}

          {/* =========================================
              NAVİGASYON BUTONLARI
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
                onPress={createDocument}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("documents.saveDocument")}
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
  stepContainer: {
    width: "100%",
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
  optionalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  fileBox: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  fileSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  clearDateText: {
    fontSize: 13,
    fontWeight: "700",
  },
  carSelectorWrapper: {
    position: "relative",
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
  dropdownOverlayType: {
    position: "absolute",
    top: 80,
    left: 18,
    right: 18,
    maxHeight: 250,
    borderWidth: 1,
    borderRadius: 14,
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
