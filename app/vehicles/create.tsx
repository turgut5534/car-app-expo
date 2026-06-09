import { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

const API_URL = "http://192.168.0.10:3000/cars";

const carBrands = [
  "Audi",
  "BMW",
  "Citroën",
  "Dacia",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "Nissan",
  "Opel",
  "Peugeot",
  "Renault",
  "Seat",
  "Skoda",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

type CarModel = {
  Model_ID: number;
  Model_Name: string;
};

const years = Array.from({ length: 46 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

export default function CreateVehicleScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showBrands, setShowBrands] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [models, setModels] = useState<CarModel[]>([]);
  const [showModels, setShowModels] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  const fetchModelsByBrand = async (brand: string) => {
    try {
      setModelsLoading(true);
      setModel("");
      setModels([]);

      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(
        brand,
      )}?format=json`;

      const response = await fetch(url);
      const data = await response.json();

      setModels(data.Results || []);
    } catch {
      Alert.alert(t("common.error"), "Could not fetch car models");
    } finally {
      setModelsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const createVehicle = async () => {
    if (!plate.trim() || !selectedBrand || !model.trim() || !selectedYear) {
      Alert.alert(t("common.error"), t("vehicles.fillAllFields"));
      return;
    }

    console.log("UPLOAD URL:", `${API_URL}/upload`);
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const formData = new FormData();

      if (imageUri) {
        formData.append("image", {
          uri: imageUri,
          name: "car.jpg",
          type: "image/jpeg",
        } as any);
      }

      formData.append("plate", plate.trim().toUpperCase());
      formData.append("brand", selectedBrand);
      formData.append("model", model.trim());
      formData.append("year", String(selectedYear));
      formData.append("currentKm", String(mileage || 0));

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("vehicles.createFailed"));
      }

      router.replace("/vehicles");
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("vehicles.createFailed"),
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("vehicles.createTitle")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("vehicles.createSubtitle")}
          </Text>

          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View
              style={[
                styles.carCircle,
                {
                  backgroundColor:
                    theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
                },
              ]}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.carImage} />
              ) : (
                <Ionicons name="car-sport" size={64} color={theme.primary} />
              )}

              <View
                style={[styles.plusCircle, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t("vehicles.addFirstVehicle")}
            </Text>

            <Text style={[styles.label, { color: theme.text }]}>
              {t("vehicles.plate")}
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
              value={plate}
             onChangeText={(text) => setPlate(text.toUpperCase())}
              placeholder={t("vehicles.platePlaceholder")}
              placeholderTextColor={theme.mutedText}
              autoCapitalize="characters"
            />

            <Text style={[styles.label, { color: theme.text }]}>
              {t("vehicles.brand")}
            </Text>

            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                setShowBrands(!showBrands);
                setShowYears(false);
                setShowModels(false);
              }}
            >
              <Text
                style={[
                  selectedBrand ? styles.inputText : styles.placeholderText,
                  {
                    color: selectedBrand ? theme.text : theme.mutedText,
                  },
                ]}
              >
                {selectedBrand || t("vehicles.brandPlaceholder")}
              </Text>

              <Ionicons name="chevron-down" size={18} color={theme.mutedText} />
            </TouchableOpacity>

            {showBrands && (
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {carBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedBrand(brand);
                      setShowBrands(false);
                      fetchModelsByBrand(brand);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>
              {t("vehicles.model")}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              disabled={!selectedBrand || modelsLoading}
              onPress={() => {
                setShowModels(!showModels);
                setShowBrands(false);
                setShowYears(false);
              }}
            >
              <Text
                style={[
                  model ? styles.inputText : styles.placeholderText,
                  { color: model ? theme.text : theme.mutedText },
                ]}
              >
                {modelsLoading
                  ? "Loading models..."
                  : model || t("vehicles.modelPlaceholder")}
              </Text>

              <Ionicons name="chevron-down" size={18} color={theme.mutedText} />
            </TouchableOpacity>

            {showModels && (
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {models.map((item) => (
                  <TouchableOpacity
                    key={item.Model_ID}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setModel(item.Model_Name);
                      setShowModels(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {item.Model_Name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>
              {t("vehicles.year")}
            </Text>

            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                setShowYears(!showYears);
                setShowBrands(false);
              }}
            >
              <Text
                style={[
                  selectedYear ? styles.inputText : styles.placeholderText,
                  {
                    color: selectedYear ? theme.text : theme.mutedText,
                  },
                ]}
              >
                {selectedYear || t("vehicles.yearPlaceholder")}
              </Text>

              <Ionicons name="chevron-down" size={18} color={theme.mutedText} />
            </TouchableOpacity>

            {showYears && (
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      setShowYears(false);
                      setShowModels(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>
              {t("vehicles.currentMileage")}
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
              value={mileage}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, "");
                setMileage(numeric);
              }}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
              loading && styles.disabledButton,
            ]}
            onPress={createVehicle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {t("vehicles.createVehicle")}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: 22,
  },
  carCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  plusCircle: {
    position: "absolute",
    right: 6,
    bottom: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
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
  placeholderText: {},
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
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  carImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  carCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  plusCircle: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
