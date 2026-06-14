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
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@/constants/api";
import { carData } from "../../data/cars";

export type CarBrandData = {
  brand: string;
  models: string[];
};

type CarModel = {
  Model_ID: number;
  Model_Name: string;
};

const years = Array.from({ length: 46 }, (_, i) =>
  String(new Date().getFullYear() - i),
);
const fuelTypes = ["PETROL", "DIESEL", "LPG", "ELECTRIC"] as const;
type FuelType = (typeof fuelTypes)[number];

export default function CreateVehicleScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 5;

  // Form States
  const [selectedBrand, setSelectedBrand] = useState("");
  const [model, setModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | "">("");
  const [mileage, setMileage] = useState("");
  const [plate, setPlate] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // UI States
  const [models, setModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const [showFuelTypes, setShowFuelTypes] = useState(false);

  const fetchModelsByBrand = async (brand: string) => {
    try {
      setModelsLoading(true);
      setModel("");
      setModels([]);

      const found = carData.find((item) => item.brand === brand);

      if (!found) {
        setModels([]);
        return;
      }

      const formattedModels = found.models.map((name, index) => ({
        Model_ID: index,
        Model_Name: name,
      }));

      setModels(formattedModels);
    } catch {
      Alert.alert(
        t("common.error"),
        t("vehicles.fetchModelsError", "Could not fetch car models"),
      );
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

  const handleNext = () => {
    // Step Validations
    if (currentStep === 1) {
      if (!selectedBrand || !model.trim() || !selectedYear) {
        Alert.alert(
          t("common.error"),
          t(
            "vehicles.fillIdentityFields",
            "Please select brand, model, and year.",
          ),
        );
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedFuelType || !mileage.trim()) {
        Alert.alert(
          t("common.error"),
          t(
            "vehicles.fillDetailFields",
            "Please select fuel type and enter mileage.",
          ),
        );
        return;
      }
    } else if (currentStep === 3) {
      if (!plate.trim()) {
        Alert.alert(
          t("common.error"),
          t("vehicles.fillPlate", "Please enter the plate number."),
        );
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const createVehicle = async () => {
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
      formData.append("fuelType", selectedFuelType);

      const response = await fetch(`${API_URL}/cars`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || t("vehicles.createFailed"));

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

  // --- PROGRESS BAR --- //
  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  // --- STEP RENDERS --- //

  const renderStep1 = () => (
    <View style={styles.stepContentWrapper}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t("vehicles.step1Title", "Identity")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.mutedText }]}>
        {t("vehicles.step1Desc", "Select the basic info for your vehicle.")}
      </Text>

      <View style={styles.inputsContainer}>
        {/* Brand */}
        <View style={{ position: "relative", zIndex: 30, elevation: 30 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("vehicles.brand")} ⭐
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => {
              setShowBrands(!showBrands);
              setShowModels(false);
              setShowYears(false);
            }}
          >
            <Text
              style={[
                styles.inputText,
                { color: selectedBrand ? theme.text : theme.mutedText },
              ]}
            >
              {selectedBrand || t("vehicles.brandPlaceholder")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.mutedText} />
          </TouchableOpacity>
          {showBrands && (
            <View
              style={[
                styles.dropdownOverlay,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                {carData.map((item) => (
                  <TouchableOpacity
                    key={item.brand}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedBrand(item.brand);
                      setShowBrands(false);
                      fetchModelsByBrand(item.brand);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {item.brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Model */}
        <View style={{ position: "relative", zIndex: 20, elevation: 20 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("vehicles.model")} ⭐
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: !selectedBrand ? 0.5 : 1,
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
                styles.inputText,
                { color: model ? theme.text : theme.mutedText },
              ]}
            >
              {modelsLoading
                ? t("vehicles.loadingModels", "Loading models...")
                : model || t("vehicles.modelPlaceholder")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.mutedText} />
          </TouchableOpacity>
          {showModels && (
            <View
              style={[
                styles.dropdownOverlay,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
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
              </ScrollView>
            </View>
          )}
        </View>

        {/* Year */}
        <View style={{ position: "relative", zIndex: 10, elevation: 10 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("vehicles.year")} ⭐
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => {
              setShowYears(!showYears);
              setShowBrands(false);
              setShowModels(false);
            }}
          >
            <Text
              style={[
                styles.inputText,
                { color: selectedYear ? theme.text : theme.mutedText },
              ]}
            >
              {selectedYear || t("vehicles.yearPlaceholder")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.mutedText} />
          </TouchableOpacity>
          {showYears && (
            <View
              style={[
                styles.dropdownOverlay,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
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
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContentWrapper}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t("vehicles.step2Title", "Details")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.mutedText }]}>
        {t("vehicles.step2Desc", "Technical specifications of the vehicle.")}
      </Text>

      <View style={styles.inputsContainer}>
        {/* Fuel Type */}
        <View style={{ position: "relative", zIndex: 20, elevation: 20 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("vehicles.fuelType")} ⭐
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => setShowFuelTypes(!showFuelTypes)}
          >
            <Text
              style={[
                styles.inputText,
                { color: selectedFuelType ? theme.text : theme.mutedText },
              ]}
            >
              {selectedFuelType
                ? t(`vehicles.fuelTypes.${selectedFuelType}`)
                : t("vehicles.fuelTypePlaceholder")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.mutedText} />
          </TouchableOpacity>
          {showFuelTypes && (
            <View
              style={[
                styles.dropdownOverlay,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {fuelTypes.map((fuel) => (
                <TouchableOpacity
                  key={fuel}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => {
                    setSelectedFuelType(fuel);
                    setShowFuelTypes(false);
                  }}
                >
                  <Text style={[styles.dropdownText, { color: theme.text }]}>
                    {t(`vehicles.fuelTypes.${fuel}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Mileage */}
        <View style={{ position: "relative", zIndex: 10 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("vehicles.currentMileage")} ⭐
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.inputText,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={mileage}
            onChangeText={(text) => setMileage(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            placeholder="e.g. 150000"
            placeholderTextColor={theme.mutedText}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContentWrapper}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t("vehicles.step3Title", "Plate")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.mutedText }]}>
        {t("vehicles.step3Desc", "Enter the official registration plate.")}
      </Text>

      <View style={styles.inputsContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          {t("vehicles.plate")} ⭐
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.inputText,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.text,
              fontSize: 20,
              textAlign: "center",
              letterSpacing: 2,
            },
          ]}
          value={plate}
          onChangeText={(text) => setPlate(text.toUpperCase())}
          placeholder={t("vehicles.platePlaceholder")}
          placeholderTextColor={theme.mutedText}
          autoCapitalize="characters"
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContentWrapper}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t("vehicles.step4Title", "Photo")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.mutedText }]}>
        {t("vehicles.step4Desc", "Upload a photo of your vehicle (Optional).")}
      </Text>

      <View
        style={[
          styles.inputsContainer,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.8}
          style={styles.photoContainer}
        >
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
              <Ionicons name="car-sport" size={80} color={theme.primary} />
            )}
            <View
              style={[styles.plusCircle, { backgroundColor: theme.primary }]}
            >
              <Ionicons
                name={imageUri ? "pencil" : "camera"}
                size={24}
                color="#fff"
              />
            </View>
          </View>
          <Text style={[styles.photoHelperText, { color: theme.mutedText }]}>
            {imageUri
              ? t("vehicles.tapToChange", "Tap to change photo")
              : t("vehicles.tapToUpload", "Tap to upload photo")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContentWrapper}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {t("vehicles.step5Title", "Review")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.mutedText }]}>
        {t(
          "vehicles.step5Desc",
          "Check your vehicle details before submitting.",
        )}
      </Text>

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.summaryImage} />
        )}

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            {t("vehicles.brand")}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {selectedBrand}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            {t("vehicles.model")}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {model}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            {t("vehicles.year")}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {selectedYear}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            {t("vehicles.fuelType")}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {t(`vehicles.fuelTypes.${selectedFuelType}`)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            {t("vehicles.currentMileage")}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {mileage} km
          </Text>
        </View>
        <View
          style={[styles.summaryRow, { borderBottomWidth: 0, marginBottom: 0 }]}
        >
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            {t("vehicles.plate")}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {plate}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <View
          style={[
            styles.stepIndicator,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text
            style={{ color: theme.primary, fontWeight: "800", fontSize: 14 }}
          >
            {t("vehicles.step", "Step")} {currentStep} / {TOTAL_STEPS}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={[styles.progressBarContainer, { backgroundColor: theme.border }]}
      >
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: theme.primary, width: `${progressPercentage}%` },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonBack,
              { borderColor: theme.border, opacity: currentStep === 1 ? 0 : 1 },
            ]}
            onPress={handleBack}
            disabled={currentStep === 1}
          >
            <Text style={[styles.navButtonTextBack, { color: theme.text }]}>
              {t("common.back", "Back")}
            </Text>
          </TouchableOpacity>

          {currentStep < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.navButtonText}>
                {t("common.next", "Next")}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: theme.primary },
                loading && styles.disabledButton,
              ]}
              onPress={createVehicle}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.navButtonText}>
                    {t("vehicles.createVehicle", "Create Vehicle")}
                  </Text>
                  <Ionicons
                    name="checkmark-done"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  stepIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  progressBarContainer: {
    height: 4,
    width: "100%",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContentWrapper: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    flex: 1,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  inputsContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    minHeight: 60, // Büyütüldü
    borderWidth: 1,
    borderRadius: 16, // Daha yumuşak köşeler
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownOverlay: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "600",
  },
  photoContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  carCircle: {
    width: 200, // Epey büyütüldü
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  carImage: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  plusCircle: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  photoHelperText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  summaryImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: "row",
    height: 60, // Büyütüldü
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  navButtonBack: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    marginRight: 10,
    marginLeft: 0,
  },
  navButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
  navButtonTextBack: {
    fontWeight: "800",
    fontSize: 17,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
