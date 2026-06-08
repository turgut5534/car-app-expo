import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.10:3000/vehicles";

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

const years = Array.from({ length: 46 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

export default function CreateVehicleScreen() {
  const { t } = useTranslation();

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showBrands, setShowBrands] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const [loading, setLoading] = useState(false);

  const createVehicle = async () => {
    if (!plate.trim() || !selectedBrand || !model.trim() || !selectedYear) {
      Alert.alert(t("common.error"), t("vehicles.fillAllFields"));
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plate,
          brand: selectedBrand,
          model,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("vehicles.createFailed"));
      }

      router.replace("/vehicles");
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("vehicles.createFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#081331" />
        </TouchableOpacity>

        <Text style={styles.title}>{t("vehicles.createTitle")}</Text>
        <Text style={styles.subtitle}>{t("vehicles.createSubtitle")}</Text>

        <View style={styles.carCircle}>
          <Ionicons name="car-sport" size={64} color="#0057E7" />

          <View style={styles.plusCircle}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("vehicles.addFirstVehicle")}</Text>

          <Text style={styles.label}>{t("vehicles.plate")}</Text>
          <TextInput
            style={styles.input}
            value={plate}
            onChangeText={setPlate}
            placeholder={t("vehicles.platePlaceholder")}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>{t("vehicles.brand")}</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setShowBrands(!showBrands);
              setShowYears(false);
            }}
          >
            <Text style={selectedBrand ? styles.inputText : styles.placeholderText}>
              {selectedBrand || t("vehicles.brandPlaceholder")}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          {showBrands && (
            <View style={styles.dropdown}>
              {carBrands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedBrand(brand);
                    setShowBrands(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{brand}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>{t("vehicles.model")}</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder={t("vehicles.modelPlaceholder")}
          />

          <Text style={styles.label}>{t("vehicles.year")}</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setShowYears(!showYears);
              setShowBrands(false);
            }}
          >
            <Text style={selectedYear ? styles.inputText : styles.placeholderText}>
              {selectedYear || t("vehicles.yearPlaceholder")}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          {showYears && (
            <View style={styles.dropdown}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYears(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={createVehicle}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t("common.loading") : t("vehicles.createVehicle")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#081331",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 22,
  },
  carCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#EEF4FF",
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
    backgroundColor: "#0057E7",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#081331",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#081331",
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#D6DCE8",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    color: "#081331",
    fontWeight: "600",
  },
  placeholderText: {
    color: "#94A3B8",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#D6DCE8",
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  dropdownText: {
    color: "#081331",
    fontWeight: "600",
  },
  button: {
    height: 56,
    backgroundColor: "#0057E7",
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
});