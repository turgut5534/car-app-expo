import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import { CarEdit, CarImage } from "../../../types/car";

const { width } = Dimensions.get("window");

export default function VehicleEditScreen() {
  const { theme } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);

  const [car, setCar] = useState<CarEdit>({
    brand: "",
    model: "",
    plate: "",
    currentKm: 0,
    images: [],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // ---------------- FETCH CAR ----------------
  const fetchCarInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return router.replace("/(auth)/login");

      const res = await fetch(`${API_URL}/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setCar({
        brand: data.brand || "",
        model: data.model || "",
        plate: data.plate || "",
        currentKm: data.currentKm || 0,
        images: data.images || [],
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarInfo();
  }, []);

  // ---------------- PICK IMAGE ----------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImage: CarImage = {
        uri: result.assets[0].uri,
        isNew: true,
      };

      setCar((prev) => ({
        ...prev,
        images: [...prev.images, newImage],
      }));
    }
  };

  // ---------------- UPDATE FIELD ----------------
  const updateField = (key: keyof CarEdit, value: any) => {
    setCar((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ---------------- SAVE ----------------
  const saveCar = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();

      formData.append("brand", car.brand);
      formData.append("model", car.model);
      formData.append("plate", car.plate);
      formData.append("currentKm", String(car.currentKm));

      car.images.forEach((img, index) => {
        if (img.isNew) {
          formData.append("images", {
            uri: img.uri,
            name: `image-${index}.jpg`,
            type: "image/jpeg",
          } as any);
        }
      });

      const res = await fetch(`${API_URL}/cars/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      Alert.alert("Success", "Car updated");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Edit Vehicle
          </Text>

          <TouchableOpacity onPress={saveCar}>
            <Text style={{ color: theme.primary, fontWeight: "800" }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* IMAGE SLIDER */}
        <FlatList
          ref={flatListRef}
          data={car.images}
          horizontal
          pagingEnabled
          keyExtractor={(_, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
          renderItem={({ item }) => (
            <Image source={{ uri: `${API_URL}/uploads/cars/${item.imageUrl}` }} style={styles.image} />
          )}
        />

        {/* DOTS */}
        <View style={styles.dots}>
          {car.images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIndex ? theme.primary : "#ccc" },
              ]}
            />
          ))}
        </View>

        {/* ADD IMAGE */}
        <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
          <Ionicons name="add" size={20} color={theme.primary} />
          <Text style={{ color: theme.text, fontWeight: "700" }}>
            Add Image
          </Text>
        </TouchableOpacity>

        {/* FORM */}
        <View style={styles.form}>
          <Input label="Brand" value={car.brand} onChange={(v) => updateField("brand", v)} />
          <Input label="Model" value={car.model} onChange={(v) => updateField("model", v)} />
          <Input label="Plate" value={car.plate} onChange={(v) => updateField("plate", v)} />
          <Input label="Year" value={car.year} onChange={(v) => updateField("year", v)} />
          <Input
            label="Mileage"
            value={String(car.currentKm)}
            onChange={(v) => updateField("currentKm", Number(v))}
            keyboardType="numeric"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------- INPUT COMPONENT ----------------
function Input({ label, value, onChange, keyboardType }: any) {
  const { theme } = useAppTheme();

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: theme.mutedText, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          padding: 10,
          borderRadius: 10,
          color: theme.text,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  image: {
    width,
    height: 260,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  addBtn: {
    margin: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },

  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});