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
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useAppTheme } from "../../../../context/ThemeContext";
import { API_URL } from "@/constants/api";

type ExistingFile = {
  id: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
};

export default function EditFuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [liter, setLiter] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("2.50");
  const [totalCost, setTotalCost] = useState("");
  const [mileageKm, setMileageKm] = useState("");

  // File States
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [newFiles, setNewFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  // Stepper Refs
  const priceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PRICE_STEP = 0.01;

  useEffect(() => {
    fetchFuelDetails();
    return () => clearPriceTimers();
  }, [id]);

  // Auto-calculate liters when price or total cost changes
  useEffect(() => {
    const cost = Number(totalCost);
    const price = Number(pricePerLiter);
    if (cost > 0 && price > 0) {
      setLiter((cost / price).toFixed(2));
    } else {
      setLiter("");
    }
  }, [totalCost, pricePerLiter]);

  const fetchFuelDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/fuels/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("fuel.loadFailed", { defaultValue: "Yakıt bilgileri yüklenemedi." }));
      }

      const fuel = data.fuel || data;

      setPricePerLiter(fuel.pricePerLiter?.toString() || "2.50");
      setTotalCost(fuel.totalAmount?.toString() || "");
      setMileageKm(fuel.km?.toString() || "");
      setLiter(fuel.liter?.toString() || "");

      if (fuel.files && Array.isArray(fuel.files)) {
        setExistingFiles(fuel.files);
      } else if (fuel.attachments && Array.isArray(fuel.attachments)) {
        setExistingFiles(fuel.attachments);
      }

    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("fuel.loadFailed", { defaultValue: "Yakıt bilgileri yüklenemedi." })
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Price Stepper Logic
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

  // File Management
  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setNewFiles((prev) => [...prev, ...result.assets]);
      }
    } catch {
      Alert.alert(t("common.error"), t("fuel.fileSelectFailed", { defaultValue: "Dosya seçimi başarısız oldu." }));
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmDeleteExistingFile = (fileId: string) => {
    Alert.alert(
      t("common.confirmDelete"),
      t("fuel.deleteFileConfirmation", { defaultValue: "Bu dosyayı silmek istediğinize emin misiniz?" }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteExistingFile(fileId),
        },
      ]
    );
  };

  const deleteExistingFile = async (fileId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/fuels/${id}/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t("common.error"));
      }

      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("common.error")
      );
    }
  };

  const updateFuel = async () => {
    if (!pricePerLiter.trim() || !totalCost.trim() || !mileageKm.trim()) {
      Alert.alert(t("common.error"), t("fuel.fillAllFields"));
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const formData = new FormData();
      formData.append("liter", String(liter));
      formData.append("pricePerLiter", String(pricePerLiter));
      formData.append("totalAmount", String(totalCost));
      formData.append("km", String(mileageKm));

      newFiles.forEach((file, index) => {
        const fileObj = {
          uri: Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
          name: file.name || `file_${index}`,
          type: file.mimeType || "application/octet-stream",
        };
        formData.append("files", fileObj as any);
      });

      const response = await fetch(`${API_URL}/fuels/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("fuel.updateFailed", { defaultValue: "Yakıt kaydı güncellenemedi." }));
      }

      router.back();
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("fuel.updateFailed", { defaultValue: "Yakıt kaydı güncellenemedi." })
      );
    } finally {
      setSaving(false);
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
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.exitButton} onPress={router.back}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons name="create-outline" size={56} color="#16A34A" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("fuel.editTitle", { defaultValue: "Yakıtı Düzenle" })}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("fuel.editSubtitle", { defaultValue: "Yakıt alım detaylarını aşağıdan güncelleyebilirsiniz." })}
          </Text>

          {/* Form Fields Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
              {t("fuel.pricePerLiter")}
            </Text>
            <View
              style={[
                styles.priceStepper,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View>
                <Text style={[styles.priceStepperLabel, { color: theme.mutedText }]}>
                  {t("fuel.pricePerLiter")}
                </Text>
                <Text style={[styles.priceStepperValue, { color: theme.text }]}>
                  {pricePerLiter}
                </Text>
              </View>
              <View style={styles.priceButtons}>
                <Pressable
                  style={[
                    styles.priceButton,
                    {
                      backgroundColor:
                        theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
                    },
                  ]}
                  onPressIn={() => startChangingPrice(1)}
                  onPressOut={stopChangingPrice}
                >
                  <Ionicons name="chevron-up" size={22} color="#16A34A" />
                </Pressable>
                <Pressable
                  style={[
                    styles.priceButton,
                    {
                      backgroundColor:
                        theme.activeMode === "dark" ? "#450A0A" : "#FEE2E2",
                    },
                  ]}
                  onPressIn={() => startChangingPrice(-1)}
                  onPressOut={stopChangingPrice}
                >
                  <Ionicons name="chevron-down" size={22} color="#DC2626" />
                </Pressable>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>
              {t("fuel.totalCost")}
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
              value={totalCost}
              onChangeText={(text) => setTotalCost(text.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.mutedText}
            />

            {/* Calculated Liters Display */}
            {liter !== "" && (
              <View style={styles.literDisplayContainer}>
                <Text style={[styles.literLabel, { color: theme.mutedText }]}>
                  {t("common.calculatedLiters", { defaultValue: "Hesaplanan Litre" })}
                </Text>
                <Text style={[styles.literValue, { color: theme.primary }]}>
                  {liter} L
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>
              {t("fuel.mileageKm")}
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
              onChangeText={(text) => setMileageKm(text.replace(/[^0-9]/g, ""))}
              placeholder="145000"
              placeholderTextColor={theme.mutedText}
              keyboardType="numeric"
            />
          </View>

          {/* File Management Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 },
            ]}
          >
            <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
              {t("fuel.addAttachments", { defaultValue: "Belgeler / Resimler" })}
            </Text>

            {/* Upload Button */}
            <TouchableOpacity
              style={[
                styles.uploadArea,
                { borderColor: theme.border, backgroundColor: theme.background },
              ]}
              onPress={pickFiles}
            >
              <Ionicons name="cloud-upload-outline" size={36} color={theme.primary} />
              <Text style={[styles.uploadText, { color: theme.text }]}>
                {t("fuel.selectFiles", { defaultValue: "Dosyaları Seçmek İçin Dokunun" })}
              </Text>
              <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 4 }}>
                {t("fuel.fileTypes", { defaultValue: "Görsel veya PDF" })}
              </Text>
            </TouchableOpacity>

            {/* Existing Files */}
            {existingFiles.length > 0 && (
              <View style={styles.fileList}>
                <Text style={[styles.fileSectionTitle, { color: theme.mutedText }]}>
                  {t("fuel.existingFiles", { defaultValue: "Mevcut Dosyalar" })}
                </Text>
                {existingFiles.map((file) => (
                  <View
                    key={file.id}
                    style={[
                      styles.fileRow,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name={
                        file.mimeType?.startsWith("image/") || file.originalName?.match(/\.(jpeg|jpg|gif|png)$/)
                          ? "image-outline"
                          : "document-text-outline"
                      }
                      size={20}
                      color={theme.text}
                    />
                    <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                      {file.originalName || file.fileName}
                    </Text>
                    <TouchableOpacity onPress={() => confirmDeleteExistingFile(file.id)}>
                      <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* New Files */}
            {newFiles.length > 0 && (
              <View style={styles.fileList}>
                <Text style={[styles.fileSectionTitle, { color: theme.mutedText }]}>
                  {t("fuel.newFiles", { defaultValue: "Yeni Eklenen Dosyalar" })}
                </Text>
                {newFiles.map((file, index) => (
                  <View
                    key={index}
                    style={[
                      styles.fileRow,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name={file.mimeType?.startsWith("image/") ? "image-outline" : "document-text-outline"}
                      size={20}
                      color={theme.text}
                    />
                    <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeNewFile(index)}>
                      <Ionicons name="close-circle" size={22} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary, flex: 1 },
                saving && styles.disabledButton,
              ]}
              onPress={updateFuel}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {t("fuel.updateFuel", { defaultValue: "Yakıtı Güncelle" })}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
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
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 10,
  },
  exitButton: {
    padding: 4,
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
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  priceStepper: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceStepperLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  priceStepperValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  priceButtons: {
    flexDirection: "row",
    gap: 8,
  },
  priceButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  literDisplayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  literLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  literValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  uploadArea: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  fileList: {
    marginTop: 20,
    gap: 10,
  },
  fileSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});