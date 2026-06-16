import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Toast } from "@/components/Toast";

import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import { CarEdit } from "../../../types/car";
import { carData } from "@/data/cars";

const SCREEN_WIDTH = Dimensions.get("window").width;

type CarModel = {
  Model_ID: number;
  Model_Name: string;
};

export default function VehicleEditScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const years = Array.from({ length: 46 }, (_, i) =>
    String(new Date().getFullYear() - i),
  );

  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState<CarEdit | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [showYears, setShowYears] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<CarModel[]>([]);
  
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  const fetchCarInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return router.replace("/(auth)/login");

      const res = await fetch(`${API_URL}/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSelectedYear(data.year);
      setCar(data);

      if (data.brand) {
        loadModelsForBrand(data.brand);
      }
    } catch (e: any) {
      Alert.alert(t("common.error", "Error"), e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarInfo();
  }, []);

  const loadModelsForBrand = (brand: string) => {
    const found = carData.find((item) => item.brand === brand);
    if (found) {
      const formattedModels = found.models.map((name, index) => ({
        Model_ID: index,
        Model_Name: name,
      }));
      setAvailableModels(formattedModels);
    } else {
      setAvailableModels([]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const updateField = (key: keyof CarEdit, value: any) => {
    setCar((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const saveCar = async () => {
    if (!car) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      formData.append("carId", car.id);
      formData.append("brand", car.brand);
      formData.append("model", car.model);
      formData.append("year", selectedYear);
      formData.append("plate", car.plate);
      formData.append("currentKm", String(car.currentKm));

      if (newImage) {
        formData.append("file", {
          uri: newImage,
          name: "car-image.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${API_URL}/cars/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update");
      }

      setToast({ visible: true, message: "Image added" });
      setNewImage('')
      fetchCarInfo(); 
    } catch (e: any) {
      Alert.alert(t("common.error", "Error"), e.message);
    }
  };

  // BACKEND: SET COVER PHOTO WITH CONFIRMATION
  const handleSetCoverPhoto = (photo: any) => {
    setActiveMenuIndex(null);

    Alert.alert(
      t("vehicles.confirmCoverTitle", "Set Cover Photo"),
      t("vehicles.confirmCoverMessage", "Are you sure you want to set this image as the cover photo?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.yes", "Yes"),
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(`${API_URL}/cars/${id}/cover/${photo.id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to set cover photo");
              }

              setToast({ visible: true, message: "Cover updated" });
              fetchCarInfo(); 
            } catch (e: any) {
              Alert.alert(t("common.error", "Error"), e.message);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // BACKEND: DELETE PHOTO WITH CONFIRMATION
  const handleDeletePhoto = (photo: any) => {
    setActiveMenuIndex(null);

    Alert.alert(
      t("vehicles.confirmDeleteTitle", "Delete Photo"),
      t("vehicles.confirmDeleteMessage", "Are you sure you want to permanently delete this photo?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(`${API_URL}/cars/photos/${photo.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete photo");
              }

              // Update the local state UI instantly without heavy reload
              if (car) {
                setCar({
                  ...car,
                  photos: car.photos.filter((p: any) => p.id !== photo.id),
                });
              }

              setToast({ visible: true, message: "Photo deleted" });
              fetchCarInfo()

            } catch (e: any) {
              Alert.alert(t("common.error", "Error"), e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !car) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t("vehicles.editVehicle", "Edit Vehicle")}
            </Text>
            <TouchableOpacity onPress={saveCar}>
              <Text style={{ color: theme.primary, fontWeight: "800" }}>
                {t("common.save", "Save")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* IMAGE SLIDER */}
          <View style={styles.sliderContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScrollBeginDrag={() => setActiveMenuIndex(null)}
            >
              {car.photos &&
                car.photos.length > 0 &&
                car.photos.map((photo: any, index: number) => {
                  return (
                    <View key={`photo-${index}`} style={styles.imageWrapper}>
                      <Image
                        source={{
                          uri: `${API_URL}/uploads/cars/${photo.fileName}`,
                        }}
                        style={styles.image}
                      />
                      
                      {/* THREE DOTS BUTTON */}
                      <TouchableOpacity
                        style={styles.dotsButton}
                        onPress={() =>
                          setActiveMenuIndex(activeMenuIndex === index ? null : index)
                        }
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                      </TouchableOpacity>

                      {/* OPTIONS MENU */}
                      {activeMenuIndex === index && (
                        <View
                          style={[
                            styles.photoMenu,
                            { backgroundColor: theme.card, borderColor: theme.border },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.photoMenuItem,
                              { borderBottomColor: theme.border },
                            ]}
                            onPress={() => handleSetCoverPhoto(photo)}
                          >
                            <Text style={{ color: theme.text }}>
                              {t("vehicles.setCover", "Set as Cover Photo")}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.photoMenuItem, { borderBottomWidth: 0 }]}
                            onPress={() => handleDeletePhoto(photo)}
                          >
                            <Text style={{ color: "#EF4444" }}>
                              {t("common.delete", "Delete")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
            </ScrollView>

            <TouchableOpacity style={styles.editImageBtn} onPress={pickImage}>
              <Ionicons name="camera" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* NEW IMAGE PREVIEW BADGE */}
          {newImage && (
            <View
              style={[
                styles.badgeContainer,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.badgeLeft}>
                <Image source={{ uri: newImage }} style={styles.badgePreview} />
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#10B981"
                  style={{ marginLeft: 8 }}
                />
              </View>
              <TouchableOpacity
                onPress={() => setNewImage(null)}
                style={styles.badgeCloseBtn}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={theme.mutedText}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* FORM */}
          <View style={styles.form}>
            {/* BRAND SELECTION */}
            <View
              style={{
                position: "relative",
                zIndex: 30,
                elevation: 30,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: theme.mutedText, marginBottom: 6 }}>
                {t("vehicles.brand", "Brand")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownInput,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => {
                  setShowBrands(!showBrands);
                  setShowModels(false);
                  setShowYears(false);
                  setActiveMenuIndex(null);
                }}
              >
                <Text
                  style={{ color: car.brand ? theme.text : theme.mutedText }}
                >
                  {car.brand || t("vehicles.selectBrand", "Select Brand")}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.mutedText}
                />
              </TouchableOpacity>

              {showBrands && (
                <View
                  style={[
                    styles.dropdownOverlay,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                    {[...carData]
                      .sort((a, b) => a.brand.localeCompare(b.brand))
                      .map((item) => (
                        <TouchableOpacity
                          key={item.brand}
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => {
                            updateField("brand", item.brand);
                            updateField("model", "");
                            loadModelsForBrand(item.brand);
                            setShowBrands(false);
                          }}
                        >
                          <Text style={{ color: theme.text }}>
                            {item.brand}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* MODEL SELECTION */}
            <View
              style={{
                position: "relative",
                zIndex: 20,
                elevation: 20,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: theme.mutedText, marginBottom: 6 }}>
                {t("vehicles.model", "Model")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownInput,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: !car.brand ? 0.5 : 1,
                  },
                ]}
                disabled={!car.brand}
                onPress={() => {
                  setShowModels(!showModels);
                  setShowBrands(false);
                  setShowYears(false);
                }}
              >
                <Text
                  style={{ color: car.model ? theme.text : theme.mutedText }}
                >
                  {car.model || t("vehicles.selectModel", "Select Model")}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.mutedText}
                />
              </TouchableOpacity>

              {showModels && (
                <View
                  style={[
                    styles.dropdownOverlay,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                    {availableModels.map((item) => (
                      <TouchableOpacity
                        key={item.Model_ID}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => {
                          updateField("model", item.Model_Name);
                          setShowModels(false);
                        }}
                      >
                        <Text style={{ color: theme.text }}>
                          {item.Model_Name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* YEAR SELECTION */}
            <View style={{
                position: "relative",
                zIndex: 10,
                elevation: 10,
                marginBottom: 12,
              }}>
              <Text style={{ color: theme.mutedText, marginBottom: 6 }}>
                {t("vehicles.year", "Year")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownInput,
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
                  {selectedYear || t("vehicles.yearPlaceholder", "Select Year")}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.mutedText}
                />
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
                        <Text
                          style={[styles.dropdownText, { color: theme.text }]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <Input
              label={t("vehicles.plate", "Plate")}
              value={car.plate}
              onChange={(v: any) => updateField("plate", v)}
            />
            <Input
              label={t("vehicles.mileage", "Mileage")}
              value={String(car.currentKm)}
              onChange={(v: any) => updateField("currentKm", Number(v))}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>
         <Toast {...toast} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input({ label, value, onChange, keyboardType }: any) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: 12, zIndex: 1, elevation: 1 }}>
      <Text style={{ color: theme.mutedText, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          padding: 12,
          borderRadius: 10,
          color: theme.text,
          backgroundColor: theme.card,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  sliderContainer: { position: "relative", height: 260 },
  imageWrapper: { width: SCREEN_WIDTH, height: 260 },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  editImageBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 20,
  },
  dotsButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  photoMenu: {
    position: "absolute",
    top: 55,
    right: 15,
    borderWidth: 1,
    borderRadius: 10,
    minWidth: 160,
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  photoMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  form: { paddingHorizontal: 20, paddingBottom: 20, marginTop: 10 },
  dropdownInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  dropdownOverlay: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 15,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  badgeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgePreview: {
    width: 50,
    height: 35,
    borderRadius: 6,
    resizeMode: "cover",
  },
  badgeCloseBtn: {
    padding: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "600",
  },
});