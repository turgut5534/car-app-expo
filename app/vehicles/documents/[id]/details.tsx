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
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import { DocumentRecord } from "@/types/car";
const { width } = Dimensions.get("window");

export default function DocumentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedIsPdf, setSelectedIsPdf] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchDocument = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const res = await fetch(`${API_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setDoc(data);
    } catch (e) {
      Alert.alert(
        t("common.error"),
        t("documents.loadFailed", "Belge yüklenemedi."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocument();
  }, []);

  // Düzenleme Fonksiyonu
  const handleEdit = () => {
    router.push(`/vehicles/documents/${id}/edit` as any);
  };

  // Silme Fonksiyonu
  const handleDelete = () => {
    Alert.alert(
      t("common.delete", "Sil"),
      t(
        "documents.deleteConfirm",
        "Bu belgeyi silmek istediğinize emin misiniz?",
      ),
      [
        { text: t("common.cancel", "İptal"), style: "cancel" },
        {
          text: t("common.delete", "Sil"),
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(`${API_URL}/documents/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) throw new Error("Delete failed");

              router.back();
            } catch (e) {
              Alert.alert(
                t("common.error"),
                t("documents.deleteFailed", "Belge silinemedi."),
              );
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>{t("documents.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const carImageUrl =
    doc.car.photos || (doc.car as any).image
      ? `${API_URL}/uploads/cars/${doc.car.photos[0].fileName || (doc.car as any).image}`
      : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {doc.title || t(`documentTypes.${doc.type}`)}
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
        <View
          style={[styles.card, styles.carCard, { backgroundColor: theme.card }]}
        >
          {carImageUrl ? (
            <Image
              source={{ uri: carImageUrl }}
              style={styles.carImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.carImagePlaceholder,
                { backgroundColor: theme.background },
              ]}
            >
              <Ionicons name="car-outline" size={28} color={theme.mutedText} />
            </View>
          )}

          <View style={styles.carDetails}>
            <Text
              style={{ color: theme.mutedText, fontSize: 12, marginBottom: 4 }}
            >
              {t("cars.vehicle")}
            </Text>
            <Text
              style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}
            >
              {doc.car.brand} {doc.car.model}
            </Text>
            <Text
              style={{
                color: theme.mutedText,
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              {doc.car.plate}
            </Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Info
            label={t("documents.type", "Type")}
            value={t(`documentTypes.${doc.type}`)}
            theme={theme}
          />
          <Info
            label={t("documents.title", "Title")}
            value={doc.title || t(`documentTypes.${doc.type}`)}
            theme={theme}
          />
          <Info
            label={t("documents.createdAt", "Created")}
            value={new Date(doc.createdAt).toLocaleDateString("pl-PL")}
            theme={theme}
          />
          <Info
            label={t("documents.expiresAt", "Expires")}
            value={
              doc.expiresAt
                ? new Date(doc.expiresAt).toLocaleDateString("pl-PL")
                : "-"
            }
            theme={theme}
            isLast
          />
        </View>

        {/* HORIZONTAL FILES SCROLL */}
        {doc.attachments?.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("documents.files", "Files")} ({doc.attachments.length})
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentScrollContent}
            >
              {doc.attachments.map((attachment) => {
                const fileUrl = `${API_URL}/uploads/documents/${attachment.fileName}`;
                const isPdf = attachment.fileName
                  .toLowerCase()
                  .endsWith(".pdf");

                return (
                  <TouchableOpacity
                    key={attachment.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedFile(fileUrl);
                      setSelectedIsPdf(isPdf);
                      setPreviewOpen(true);
                    }}
                    style={[
                      styles.attachmentThumbnail,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {isPdf ? (
                      <View style={styles.pdfThumbnailBox}>
                        <Ionicons
                          name="document-text"
                          size={40}
                          color="#EF4444"
                        />
                        <Text
                          style={[
                            styles.pdfThumbnailText,
                            { color: theme.text },
                          ]}
                          numberOfLines={2}
                        >
                          {attachment.fileName}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: fileUrl }}
                        style={styles.imageThumbnail}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* IN-APP PREVIEW MODAL */}
      <Modal visible={previewOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <Text
              style={[styles.modalTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {doc.title || t(`documentTypes.${doc.type}`)}
            </Text>
            <TouchableOpacity
              onPress={() => setPreviewOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={doc.attachments}
            horizontal
            pagingEnabled
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const fileUrl = `${API_URL}/uploads/documents/${item.fileName}`;
              const isPdf = item.fileName.toLowerCase().endsWith(".pdf");

              return (
                <View style={{ width, flex: 1 }}>
                  {isPdf ? (
                    <WebView source={{ uri: fileUrl }} style={{ flex: 1 }} />
                  ) : (
                    <Image
                      source={{ uri: fileUrl }}
                      style={{ flex: 1, width: "100%" }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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

  // Files Layout Styles
  attachmentScrollContent: {
    gap: 12,
  },
  attachmentThumbnail: {
    width: 140,
    height: 180,
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
    padding: 12,
  },
  pdfThumbnailText: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 12,
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
