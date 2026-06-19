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
import { CarDetail } from "@/types/car";
import DateTimePicker from "@react-native-community/datetimepicker";

// Updated to match your Prisma enum
export const EXPENSE_CATEGORIES = [
  "FUEL",
  "SERVICE",
  "INSURANCE",
  "TAX",
  "PARKING",
  "CAR_WASH",
  "TOLL",
  "TIRE",
  "DOCUMENT",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export default function CreateExpenseScreen() {
  const { carId } = useLocalSearchParams<{
    carId: string;
  }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const today = new Date().toISOString().split("T")[0];

  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("FUEL");
  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [attachments, setAttachments] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);

  const [cars, setCars] = useState<CarDetail[]>([]);
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
      setDate(today ? new Date(today) : null);

      const initialCarId = selectedCarId || carList[0]?.id;
      const initialCar = carList.find(
        (car: CarDetail) => car.id === initialCarId,
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

  const createExpense = async () => {
    if (
      (category === "OTHER" && !title.trim()) ||
      !mileageKm.trim() ||
      !cost.trim()
    ) {
      Alert.alert(
        t("common.error"),
        t("expenses.fillAllFields", "Please fill all required fields."),
      );
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
          : t(`expenseCategories.${category}`);
      const finalAmount = cost.trim() ? Number(cost) : 0;

      const formData = new FormData();

      formData.append("title", finalTitle.trim());
      formData.append("carId", selectedCarId);
      // Updated field to match Prisma 'mileage'
      formData.append("mileage", String(Number(mileageKm)));
      // Updated field to match Prisma 'expenseDate'
      formData.append(
        "expenseDate",
        date ? date.toISOString().split("T")[0] : "",
      );
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

      // Updated endpoint to expenses
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            t("expenses.createFailed", "Failed to create expense"),
        );
      }

      router.replace(`/vehicles/${selectedCarId}` as any);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error
          ? error.message
          : t("expenses.createFailed", "Failed to create expense"),
      );
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = !!selectedCarId && !!category;
  const isStep2Valid =
    category === "OTHER"
      ? !!title.trim() && !!mileageKm.trim()
      : !!mileageKm.trim();

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) {
      Alert.alert(
        t("common.error"),
        t("expenses.fillAllFields", "Please fill all required fields."),
      );
      return;
    }
    if (step === 2 && !isStep2Valid) {
      Alert.alert(
        t("common.error"),
        t("expenses.fillAllFields", "Please fill all required fields."),
      );
      return;
    }
    // We can jump straight to step 4 if step 3 (cost/desc) is optional,
    // but typically cost is required for an expense, so we validate cost on final save.
    if (step < 4) {
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
                {t("common.step")} {step}/4
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
            {/* Updated icon for Expense context */}
            <Ionicons name="wallet-outline" size={56} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {step === 4
              ? t("common.summary")
              : t("expenses.createTitle", "Add Expense")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {step === 4
              ? t(
                  "expenses.checkDetailsBeforeSaving",
                  "Review your expense details",
                )
              : t(
                  "expenses.createSubtitle",
                  "Keep track of your vehicle costs",
                )}
          </Text>

          {/* =========================================
              STEP 1: VEHICLE + CATEGORY
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
                  {t("expenses.vehicle", "Vehicle")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.carSelector,
                    { backgroundColor: theme.card, borderColor: theme.border },
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
                            ? `${selectedCar.brand || ""} ${selectedCar.model || ""}`.trim()
                            : t("expenses.selectVehicle", "Select Vehicle")}
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
                        {item.photos ? (
                          <Image
                            source={{
                              uri: `${API_URL}/../uploads/cars/${item.photos[0].fileName}`,
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
                              t("expenses.vehicleFallback", "Unknown Vehicle")}
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
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    zIndex: 40,
                    elevation: 40,
                  },
                ]}
              >
                <Text style={[styles.label, { color: theme.text }]}>
                  {t("expenses.type", "Category")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.dropdownInput,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                  onPress={() => {
                    setShowCategories(!showCategories);
                    if (showCars) setShowCars(false);
                  }}
                >
                  <Text style={[styles.inputText, { color: theme.text }]}>
                    {t(`expenseCategories.${category}`)}
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
                      {EXPENSE_CATEGORIES.map((item) => (
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
                            {t(`expenseCategories.${item}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              {showCategories && <View style={{ height: 260 }} />}
            </>
          )}

          {/* =========================================
              STEP 2: MILEAGE + DATE
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
                    {t("expenses.expenseName", "Expense Name")}
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
                    placeholder={t(
                      "expenses.expenseNamePlaceholder",
                      "E.g. Traffic fine",
                    )}
                    placeholderTextColor={theme.mutedText}
                  />
                </>
              )}

              <Text style={[styles.label, { color: theme.text }]}>
                {t("expenses.mileageKm", "Mileage (km)")}
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

              <Text
                style={[styles.label, { color: theme.text, marginTop: 16 }]}
              >
                {t("expenses.date", "Date")}
              </Text>
              <TouchableOpacity
                style={[styles.input, { borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: date ? theme.text : theme.mutedText }}>
                  {date
                    ? date.toLocaleDateString("pl-PL")
                    : t("common.selectDate")}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.mutedText}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date ?? new Date()}
                  mode="date"
                  onChange={(_, d) => {
                    setShowDatePicker(false);
                    if (d) setDate(d);
                  }}
                />
              )}
            </View>
          )}

          {/* =========================================
              STEP 3: COST + DESCRIPTION + FILES
             ========================================= */}
          {step === 3 && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.label, { color: theme.text }]}>
                {t("expenses.cost", "Amount")} *
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
                placeholder="0.00"
                placeholderTextColor={theme.mutedText}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.label, { color: theme.text }]}>
                {t("expenses.description", "Description")} (
                {t("common.optional")})
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
                {t("expenses.addFile", "Add Attachments")} (
                {t("common.optional")})
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
                    ? `${attachments.length} ${t("expenses.filesSelected", "files selected")}`
                    : t("expenses.addFile", "Add Attachments")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* =========================================
              STEP 4: SUMMARY
             ========================================= */}
          {step === 4 && (
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <SummaryRow
                theme={theme}
                label={t("expenses.vehicle", "Vehicle")}
                value={
                  selectedCar
                    ? `${selectedCar.brand} ${selectedCar.model}`
                    : "-"
                }
              />
              <SummaryRow
                theme={theme}
                label={t("expenses.type", "Category")}
                value={
                  category === "OTHER"
                    ? title
                    : t(`expenseCategories.${category}`)
                }
              />
              <SummaryRow
                theme={theme}
                label={t("expenses.mileageKm", "Mileage")}
                value={`${mileageKm} km`}
              />
              <SummaryRow
                theme={theme}
                label={t("expenses.date", "Date")}
                value={date?.toLocaleDateString("pl-PL") || "-"}
              />
              <SummaryRow
                theme={theme}
                label={t("expenses.cost", "Amount")}
                value={cost ? `${cost}` : "-"}
              />
              <SummaryRow
                theme={theme}
                label={t("expenses.description", "Description")}
                value={description || "-"}
                isLast={attachments.length === 0}
              />
              {attachments.length > 0 && (
                <SummaryRow
                  theme={theme}
                  label={t("expenses.addFile", "Files")}
                  value={`${attachments.length} ${t("expenses.filesSelected", "files selected")}`}
                  isLast
                />
              )}
            </View>
          )}

          {/* =========================================
              NAVIGATION BUTTONS
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

            {step < 4 ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 },
                  ((step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid) ||
                    (step === 3 && !cost.trim())) &&
                    styles.disabledButton,
                ]}
                onPress={handleNext}
                disabled={
                  (step === 1 && !isStep1Valid) ||
                  (step === 2 && !isStep2Valid) ||
                  (step === 3 && !cost.trim())
                }
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
                onPress={createExpense}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("expenses.saveExpense", "Save Expense")}
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

// Summary Helper Component
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
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: { padding: 4 },
  stepIndicatorContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepIndicatorText: { fontWeight: "700", fontSize: 14 },
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
  subtitle: { textAlign: "center", lineHeight: 22, marginBottom: 26 },
  card: { zIndex: 1, elevation: 1 },
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
  summaryLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
  summaryValue: {
    fontSize: 14,
    fontWeight: "800",
    flex: 2,
    textAlign: "right",
  },
  label: { fontSize: 13, fontWeight: "700", marginTop: 12, marginBottom: 7 },
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
  backNavButton: { borderWidth: 1, flex: 0.4, backgroundColor: "transparent" },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 28,
  },
  carSelectorWrapper: { zIndex: 3000, elevation: 3000, position: "relative" },
  dropdownOverlay: {
    position: "absolute",
    top: 72,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 9999,
    maxHeight: 250,
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
  inputText: { fontWeight: "600" },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownText: { fontWeight: "600" },
  dropdownInput: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exitButton: { padding: 4 },
});
