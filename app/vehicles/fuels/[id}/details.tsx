import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";

// Kendi projenizdeki tiplere göre güncelleyebilirsiniz
type FuelFile = {
  id: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
};

type FuelRecord = {
  id: string;
  liter: number;
  pricePerLiter: number;
  totalAmount: number;
  km: number;
  createdAt: string;
  car: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    photos?: any[];
    image?: string;
  };
  files?: FuelFile[];
};

export default function FuelDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fuel, setFuel] = useState<FuelRecord | null>(null);

  const [previewFile, setPreviewFile] = useState<FuelFile | null>(null);

  const fetchFuel = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const res = await fetch(`${API_URL}/fuels/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // Backend'in yapısına göre data.fuel veya doğrudan data olabilir
      setFuel(data.fuel || data);
    } catch (e) {
      Alert.alert(
        t("common.error"),
        t("fuel.loadFailed", "Yakıt bilgileri yüklenemedi.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFuel();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFuel();
  }, [id]);

  const handleEdit = () => {
    // Kendi dosya yapınıza göre yolu güncelleyin
    router.push(`/vehicles/fuels/${id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      t("common.delete", "Sil"),
      t("fuel.deleteConfirm", "Bu yakıt kaydını silmek istediğinize emin misiniz?"),
      [
        { text: t("common.cancel", "İptal"), style: "cancel" },
        {
          text: t("common.delete", "Sil"),
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(`${API_URL}/fuels/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) throw new Error("Delete failed");

              router.back();
            } catch (e) {
              Alert.alert(
                t("common.error"),
                t("fuel.deleteFailed", "Yakıt kaydı silinemedi.")
              );
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!fuel) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          {t("fuel.notFound", "Yakıt kaydı bulunamadı.")}
        </Text>
      </SafeAreaView>
    );
  }

  const carImageUrl =
    fuel.car?.photos?.[0]?.fileName || fuel.car?.image
      ? `${API_URL}/uploads/cars/${fuel.car.photos?.[0]?.fileName || fuel.car.image}`
      : null;

  // Önizleme için seçilen dosyanın yolunu belirleme
  const getFileUrl = (fileName: string) => `${API_URL}/uploads/fuels/${fileName}`;
  const isPreviewPdf = previewFile?.fileName.toLowerCase().endsWith(".pdf") || previewFile?.mimeType === "application/pdf";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {t("fuel.detailsTitle", "Yakıt Detayı")}
          </Text>

          {/* DÜZENLE VE SİL BUTONLARI */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionIcon}>
              <Ionicons name="pencil" size={22} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionIcon}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CAR INFO */}
        <View style={[styles.card, styles.carCard, { backgroundColor: theme.card }]}>
          {carImageUrl ? (
            <Image
              source={{ uri: carImageUrl }}
              style={styles.carImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.carImagePlaceholder, { backgroundColor: theme.background }]}>
              <Ionicons name="car-outline" size={28} color={theme.mutedText} />
            </View>
          )}

          <View style={styles.carDetails}>
            <Text style={{ color: theme.mutedText, fontSize: 12, marginBottom: 4 }}>
              {t("cars.vehicle")}
            </Text>
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>
              {fuel.car?.brand} {fuel.car?.model}
            </Text>
            <Text style={{ color: theme.mutedText, fontWeight: "600", marginTop: 2 }}>
              {fuel.car?.plate}
            </Text>
          </View>
        </View>

        {/* FUEL DETAILS */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Info
            label={t("common.date", "Tarih")}
            value={new Date(fuel.createdAt).toLocaleDateString("pl-PL")}
            theme={theme}
          />
          <Info
            label={t("fuel.pricePerLiter", "Litre Fiyatı")}
            value={`${Number(fuel.pricePerLiter).toFixed(2)}`}
            theme={theme}
          />
          <Info
            label={t("common.liter", "Litre")}
            value={`${Number(fuel.liter).toFixed(2)} L`}
            theme={theme}
          />
          <Info
            label={t("fuel.totalCost", "Toplam Tutar")}
            value={`${Number(fuel.totalAmount).toFixed(2)}`}
            theme={theme}
          />
          <Info
            label={t("fuel.mileageKm", "Kilometre")}
            value={`${fuel.km} km`}
            theme={theme}
            isLast
          />
        </View>

        {/* ATTACHMENTS / FILES */}
        {fuel.files && fuel.files.length > 0 ? (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("fuel.files", "Eklenen Dosyalar")}
            </Text>

            <View style={styles.filesGrid}>
              {fuel.files.map((file) => {
                const isPdf = file.fileName.toLowerCase().endsWith(".pdf") || file.mimeType === "application/pdf";
                
                return (
                  <TouchableOpacity
                    key={file.id}
                    activeOpacity={0.8}
                    style={[styles.fileThumbnail, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => setPreviewFile(file)}
                  >
                    {isPdf ? (
                      <View style={styles.pdfThumbnailBox}>
                        <Ionicons name="document-text" size={32} color="#EF4444" />
                        <Text style={[styles.fileThumbnailText, { color: theme.text }]} numberOfLines={1}>
                          {file.originalName || file.fileName}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: getFileUrl(file.fileName) }}
                        style={styles.imageThumbnail}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* IN-APP PREVIEW MODAL */}
      <Modal visible={!!previewFile} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
              {previewFile?.originalName || previewFile?.fileName}
            </Text>
            <TouchableOpacity onPress={() => setPreviewFile(null)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {previewFile && (
            isPreviewPdf ? (
              <WebView
                source={{ uri: getFileUrl(previewFile.fileName) }}
                style={{ flex: 1, backgroundColor: theme.background }}
              />
            ) : (
              <Image
                source={{ uri: getFileUrl(previewFile.fileName) }}
                style={{ flex: 1, width: "100%" }}
                resizeMode="contain"
              />
            )
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Info Row Component
function Info({ label, value, theme, isLast = false }: any) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Text style={{ color: theme.mutedText, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
        {value}
      </Text>
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
  title: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },

  card: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  carCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  carImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  carImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  carDetails: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  filesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fileThumbnail: {
    width: "48%",
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  pdfThumbnailBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  fileThumbnailText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    paddingRight: 16,
  },
  closeButton: {
    padding: 4,
  },
});