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

const API_URL = "http://192.168.0.10:3000/cars";

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

type Car = {
  id: string;
  brand?: string;
  model?: string;
  plate?: string;
  imageUrl?: string;
  image?: string;
};

export default function CreateDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocumentType>("REGISTRATION");
  const [expiresAt, setExpiresAt] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(id);
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

        const response = await fetch(API_URL, {
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
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
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

      formData.append("title", title.trim());
      formData.append("type", type);
      formData.append("carId", selectedCarId);

      if (expiresAt) {
        formData.append("expiresAt", formatDateForApi(expiresAt));
      }

      if (file) {
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);
      }

      const response = await fetch(`${API_URL}/${selectedCarId}/documents`, {
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
          <TouchableOpacity style={styles.backButton} onPress={router.back}>
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
              name="document-text-outline"
              size={56}
              color={theme.primary}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("documents.createTitle")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("documents.createSubtitle")}
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
                    {car.imageUrl || car.image ? (
                      <Image
                        source={{
                          uri: `${API_URL}/../uploads/cars/${car.imageUrl}`,
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
                        {`${car.brand || ""} ${car.model || ""}`.trim() ||
                          "Araç"}
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
            <Text style={[styles.label, { color: theme.text }]}>
              {t("documents.title")}
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
              placeholder={t("documents.titlePlaceholder")}
              placeholderTextColor={theme.mutedText}
            />

            <Text style={[styles.label, { color: theme.text }]}>
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

              <Ionicons name="chevron-down" size={18} color={theme.mutedText} />
            </TouchableOpacity>

            {showTypes && (
              <View
                style={[
                  styles.dropdownOverlay,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
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
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {t(`documentTypes.${item}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

            <Text style={[styles.label, { color: theme.text }]}>
              {t("documents.file")}
            </Text>

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
                <Text style={[styles.fileTitle, { color: theme.text }]}>
                  {file ? file.name : t("documents.chooseFile")}
                </Text>

                <Text style={[styles.fileSubtitle, { color: theme.mutedText }]}>
                  {t("documents.fileHint")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontWeight: "600",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
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
