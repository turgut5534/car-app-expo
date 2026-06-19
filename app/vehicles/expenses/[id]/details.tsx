import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  Linking,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";

import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
// Note: Ensure Expense and ExpenseAttachments are exported in your types file
import { ExpenseRecord, ExpenseAttachments } from "@/types/car";

const { width } = Dimensions.get("window");

export default function ExpenseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);

  // Slider State
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const sliderRef = useRef<FlatList>(null);

  const fetchExpense = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setExpense(data);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : "Failed",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpense();
  }, []);

  const openAttachment = async (file: ExpenseAttachments) => {
    try {
      const url = `${API_URL}${file.fileUrl}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert(t("common.error"), t("expenses.fileOpenFailed"));
    }
  };

  const isImage = (file: ExpenseAttachments) => {
    return (
      file.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp)$/i.test(file.fileName)
    );
  };

  const isPdf = (file: ExpenseAttachments) => {
    return file.mimeType === "application/pdf" || /\.pdf$/i.test(file.fileName);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.mutedText, marginTop: 12 }}>
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>{t("expenses.notFound", "Expense not found")}</Text>
      </SafeAreaView>
    );
  }

  // Files classification (fallback to empty array if attachments relation is null)
  const attachments = expense.attachments || [];
  const visualAttachments = attachments.filter(
    (f) => isImage(f) || isPdf(f),
  );
  const otherAttachments = attachments.filter(
    (f) => !isImage(f) && !isPdf(f),
  );

  const shadowStyle = {
    shadowColor: theme.activeMode === "dark" ? "#000" : "#888",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.activeMode === "dark" ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 4,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("expenses.details", "Expense Details")}
          </Text>

          <View style={styles.headerActions}>
            {/* EDIT */}
            <TouchableOpacity
              onPress={() =>
                router.push(`/vehicles/expenses/${expense.id}/edit`)
              }
              style={styles.actionBtn}
            >
              <Ionicons name="create-outline" size={22} color={theme.primary} />
            </TouchableOpacity>

            {/* DELETE */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(t("common.delete"), t("expenses.deleteConfirm", "Are you sure you want to delete this expense?"), [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const token = await AsyncStorage.getItem("token");

                        await fetch(`${API_URL}/expenses/${expense.id}`, {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        });

                        router.back();
                      } catch {
                        Alert.alert(t("common.error"));
                      }
                    },
                  },
                ]);
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ICON & TITLE */}
        <View style={styles.titleSection}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
              },
            ]}
          >
            <Ionicons name="wallet" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {expense.title || t(`expenseCategories.${expense.category}`)}
          </Text>
        </View>

        {/* VEHICLE CARD */}
        <View
          style={[styles.card, { backgroundColor: theme.card }, shadowStyle]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("expenses.vehicle", "Vehicle")}
          </Text>
          <View style={styles.vehicleRow}>
            {expense.car?.photos && expense.car.photos.length > 0 ? (
              <Image
                source={{
                  uri: `${API_URL}/../uploads/cars/${expense.car.photos[0].fileName}`,
                }}
                style={styles.vehicleImage}
              />
            ) : (
              <View
                style={[
                  styles.vehiclePlaceholder,
                  { backgroundColor: theme.background },
                ]}
              >
                <Ionicons name="car-sport" size={32} color={theme.mutedText} />
              </View>
            )}
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleTitle, { color: theme.text }]}>
                {expense.car?.brand} {expense.car?.model}
              </Text>
              <View
                style={[
                  styles.plateBadge,
                  { backgroundColor: theme.background },
                ]}
              >
                <Text style={{ color: theme.text, fontWeight: "700" }}>
                  {expense.car?.plate}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* EXPENSE DETAILS CARD */}
        <View
          style={[styles.card, { backgroundColor: theme.card }, shadowStyle]}
        >
          <InfoRow
            label={t("expenses.type", "Category")}
            value={t(`expenseCategories.${expense.category}`)}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InfoRow
            label={t("expenses.date", "Date")}
            value={new Date(expense.expenseDate).toLocaleDateString("pl-PL")}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InfoRow
            label={t("expenses.mileageKm", "Mileage")}
            value={`${expense.mileage.toLocaleString()} km`}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InfoRow
            label={t("expenses.cost", "Amount")}
            value={expense.amount ? `${expense.amount} ${expense.currency}` : "-"}
            theme={theme}
            valueColor={theme.primary}
          />
        </View>

        {/* DESCRIPTION CARD */}
        {!!expense.description && (
          <View
            style={[styles.card, { backgroundColor: theme.card }, shadowStyle]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("expenses.description", "Description")}
            </Text>
            <Text
              style={{ color: theme.mutedText, lineHeight: 24, fontSize: 15 }}
            >
              {expense.description}
            </Text>
          </View>
        )}

        {/* ATTACHMENTS CARD */}
        <View
          style={[styles.card, { backgroundColor: theme.card }, shadowStyle]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("expenses.files", "Files")} ({attachments.length})
          </Text>

          {attachments.length === 0 ? (
            <Text style={{ color: theme.mutedText, fontStyle: "italic" }}>
              {t("expenses.noFiles", "No files attached")}
            </Text>
          ) : (
            <>
              {/* VISUAL THUMBNAILS (Images + PDFs) */}
              {visualAttachments.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailContainer}
                >
                  {visualAttachments.map((file, index) => {
                    if (isImage(file)) {
                      return (
                        <TouchableOpacity
                          key={file.id}
                          activeOpacity={0.8}
                          onPress={() => setPreviewIndex(index)}
                        >
                          <Image
                            source={{
                              uri: `${API_URL}/uploads/expenses/${file.fileName}`,
                            }}
                            style={styles.thumbnailImage}
                          />
                        </TouchableOpacity>
                      );
                    }

                    if (isPdf(file)) {
                      return (
                        <TouchableOpacity
                          key={file.id}
                          activeOpacity={0.8}
                          onPress={() => setPreviewIndex(index)}
                          style={[
                            styles.pdfThumbnail,
                            {
                              backgroundColor: theme.background,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name="document-text"
                            size={40}
                            color="#EF4444"
                          />
                          <Text
                            style={[styles.pdfText, { color: theme.text }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {file.fileName}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  })}
                </ScrollView>
              )}

              {/* OTHER FILES (Word, Excel, etc) */}
              {otherAttachments.length > 0 && (
                <View style={styles.filesContainer}>
                  {otherAttachments.map((file) => (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => openAttachment(file)}
                      style={[
                        styles.fileRow,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      <View
                        style={[
                          styles.fileIconBox,
                          { backgroundColor: theme.card },
                        ]}
                      >
                        <Ionicons
                          name="document-text"
                          size={20}
                          color={theme.primary}
                        />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: theme.text,
                          fontWeight: "500",
                        }}
                        numberOfLines={1}
                      >
                        {file.fileName}
                      </Text>
                      <Ionicons
                        name="download-outline"
                        size={22}
                        color={theme.mutedText}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* FULL SCREEN SLIDER MODAL (Images + PDFs) */}
      <Modal visible={previewIndex !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalPagination}>
                {previewIndex !== null ? previewIndex + 1 : 0} /{" "}
                {visualAttachments.length}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewIndex(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Slider */}
            <FlatList
              ref={sliderRef}
              data={visualAttachments}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={previewIndex}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(ev) => {
                const newIndex = Math.round(
                  ev.nativeEvent.contentOffset.x / width,
                );
                setPreviewIndex(newIndex);
              }}
              renderItem={({ item }) => {
                const url = `${API_URL}/uploads/expenses/${item.fileName}`;

                if (isImage(item)) {
                  return (
                    <View
                      style={{
                        width,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                      />
                    </View>
                  );
                }

                if (isPdf(item)) {
                  const pdfUrl = url;

                  return (
                    <View
                      style={{ width, height: "100%", backgroundColor: "#FFF" }}
                    >
                      <WebView
                        source={{ uri: pdfUrl }}
                        style={{ flex: 1 }}
                        startInLoadingState={true}
                        renderLoading={() => (
                          <ActivityIndicator
                            size="large"
                            color="#000"
                            style={styles.webviewLoader}
                          />
                        )}
                      />
                    </View>
                  );
                }

                return null;
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Reusable Info Row Component
function InfoRow({ label, value, theme, valueColor }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={{ color: theme.mutedText, fontSize: 15 }}>{label}</Text>
      <Text
        style={{
          color: valueColor || theme.text,
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  titleSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    marginRight: 16,
  },
  vehiclePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
    justifyContent: "center",
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  plateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  thumbnailContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginRight: 12,
  },
  pdfThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  pdfText: {
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
    width: "100%",
  },
  filesContainer: {
    marginTop: 10,
    gap: 12,
  },
  fileRow: {
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // MODAL & SLIDER STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 0,
    height: 60,
    zIndex: 10,
  },
  modalPagination: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  webviewLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});