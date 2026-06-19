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
import { useAppTheme } from "../../../../context/ThemeContext";
import { API_URL } from "@/constants/api";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export const EXPENSE_CATEGORIES = [
  "FUEL",
  "SERVICE",
  "INSURANCE",
  "TAX",
  "PARKING",
  "CAR_WASH",
  "TOLL",
  "TIRE",
  "DOCUMENT",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

type ExistingFile = {
  id: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
};

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FUEL");
  const [showCategories, setShowCategories] = useState(false);

  // File States
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [newAttachments, setNewAttachments] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);

  useEffect(() => {
    fetchExpenseDetails();
  }, [id]);

  const fetchExpenseDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/expenses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("expenses.loadFailed"));
      }

      // Populate states from API data
      const e = data.expense || data;

      setCategory((e.category as ExpenseCategory) || "OTHER");
      setTitle(e.title || "");
      setMileageKm(e.mileage ? e.mileage.toString() : "");

      setDate(new Date(e.expenseDate));

      setCost(e.amount ? e.amount.toString() : "");
      setDescription(e.description || "");
      setExistingFiles(e.attachments || []);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("expenses.loadFailed"),
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: true,
    });

    if (!result.canceled) {
      setNewAttachments((prev) => [...prev, ...result.assets]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmDeleteExistingFile = (fileId: string) => {
    Alert.alert(
      t("common.confirmDelete"),
      t(
        "expenses.deleteFileConfirmation",
        "Are you sure you want to delete this file?",
      ),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteExistingFile(fileId),
        },
      ],
    );
  };

  const deleteExistingFile = async (fileId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/expenses/${id}/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t("common.error"));
      }

      // Update state locally to remove the deleted file from the list
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("common.error"),
      );
    }
  };

  const updateExpense = async () => {
    if ((category === "OTHER" && !title.trim()) || !mileageKm.trim()) {
      Alert.alert(t("common.error"), t("expenses.fillAllFields"));
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");

      const finalTitle =
        category === "OTHER"
          ? title.trim()
          : t(`expenseCategories.${category}`);
      const finalAmount = cost.trim() ? Number(cost) : 0;

      const formData = new FormData();

      formData.append("title", finalTitle.trim());
      formData.append("mileage", String(Number(mileageKm)));
      formData.append(
        "expenseDate",
        date ? date.toISOString().split("T")[0] : "",
      );
      formData.append("amount", String(Number(finalAmount)));
      formData.append("category", category);
      formData.append("description", description);

      if (newAttachments.length > 0) {
        newAttachments.forEach((file) => {
          formData.append("files", {
            uri: file.uri,
            name: file.name ?? "file",
            type: file.mimeType || "application/octet-stream",
          } as any);
        });
      }

      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            t("expenses.updateFailed", "Failed to update expense"),
        );
      }

      router.back();
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error
          ? error.message
          : t("expenses.updateFailed", "Failed to update expense"),
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
          nestedScrollEnabled={true}
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
                  theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
              },
            ]}
          >
            <Ionicons name="create-outline" size={56} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("expenses.editTitle", "Edit Expense")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("expenses.editSubtitle", "Update your expense details")}
          </Text>

          {/* Form Fields */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.label, { color: theme.text }]}>
              {t("expenses.type", "Category")}
            </Text>

            <TouchableOpacity
              style={[
                styles.dropdownInput,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  zIndex: 40,
                },
              ]}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text style={[styles.inputText, { color: theme.text }]}>
                {t(`expenseCategories.${category}`)}
              </Text>
              <Ionicons
                name={showCategories ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.mutedText}
              />
            </TouchableOpacity>

            {showCategories && (
              <View
                style={[
                  styles.categoryDropdownOverlay,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ScrollView
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 240 }}
                >
                  {EXPENSE_CATEGORIES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: theme.border },
                      ]}
                      onPress={() => {
                        setCategory(item);
                        setShowCategories(false);
                        if (item !== "OTHER") setTitle("");
                      }}
                    >
                      <Text
                        style={[styles.dropdownText, { color: theme.text }]}
                      >
                        {t(`expenseCategories.${item}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {category === "OTHER" && (
              <>
                <Text
                  style={[styles.label, { color: theme.text, marginTop: 16 }]}
                >
                  {t("expenses.expenseName", "Expense Name")}
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
                  placeholder={t(
                    "expenses.expenseNamePlaceholder",
                    "E.g. Traffic fine",
                  )}
                  placeholderTextColor={theme.mutedText}
                />
              </>
            )}

            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              {t("expenses.mileageKm", "Mileage (km)")}
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

            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              {t("expenses.date", "Date")}
            </Text>
            <TouchableOpacity
              style={[styles.input, { borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: date ? theme.text : theme.mutedText }}>
                {date
                  ? date.toLocaleDateString("pl-PL")
                  : t("common.selectDate")}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.mutedText}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date ?? new Date()}
                mode="date"
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) setDate(d);
                }}
              />
            )}

            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              {t("expenses.cost", "Amount")} ({t("common.optional")})
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
              value={cost}
              onChangeText={(text) => setCost(text.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              placeholderTextColor={theme.mutedText}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              {t("expenses.description", "Description")} ({t("common.optional")}
              )
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                  minHeight: 120,
                  textAlignVertical: "top",
                  paddingTop: 12,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={theme.mutedText}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Files Management Section */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                marginTop: 16,
              },
            ]}
          >
            {/* Existing Files */}
            {existingFiles.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.label, { color: theme.text }]}>
                  {t("expenses.attachedFiles", "Attached Files")}
                </Text>

                {existingFiles.map((file) => {
                  const imageUrl = `${API_URL}/uploads/expenses/${file.fileName}`;

                  const isImage =
                    file.mimeType?.startsWith("image/") ||
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(
                      file.originalName || file.fileName || "",
                    );

                  return (
                    <View
                      key={file.id}
                      style={[
                        styles.fileCard,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {isImage && imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={{
                            width: "100%",
                            height: 180,
                            borderRadius: 8,
                            marginBottom: 8,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.fileInfo}>
                          <Ionicons
                            name="document-text-outline"
                            size={24}
                            color={theme.primary}
                          />
                        </View>
                      )}

                      <View style={styles.fileInfo}>
                        <Text
                          style={[styles.fileName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {file.originalName || file.fileName}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDeleteExistingFile(file.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* New Files */}
            {newAttachments.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.label, { color: theme.text }]}>
                  {t("expenses.newFiles", "New Files")}
                </Text>
                {newAttachments.map((file, index) => (
                  <View
                    key={`new-${index}`}
                    style={[
                      styles.fileCard,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.fileInfo}>
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color={theme.primary}
                      />
                      <Text
                        style={[styles.fileName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeNewAttachment(index)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={theme.mutedText}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>
              {t("expenses.addNewFile", "Add New File")} ({t("common.optional")}
              )
            </Text>
            <TouchableOpacity
              onPress={pickFile}
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  justifyContent: "center",
                  borderStyle: "dashed",
                },
              ]}
            >
              <Text
                style={{
                  color: theme.primary,
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                <Ionicons name="cloud-upload-outline" size={16} />{" "}
                {t("expenses.uploadFiles", "Upload files")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary, flex: 1 },
                saving && styles.disabledButton,
              ]}
              onPress={updateExpense}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {t("expenses.updateExpense", "Update Expense")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
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
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 28,
  },
  dropdownInput: {
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
  categoryDropdownOverlay: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
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
  // File Listing Styles
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
});
