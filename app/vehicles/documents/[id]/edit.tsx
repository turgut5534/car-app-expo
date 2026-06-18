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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useAppTheme } from "../../../../context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_URL } from "@/constants/api";

type DocumentType =
  | "REGISTRATION"
  | "INSURANCE"
  | "INSPECTION"
  | "INVOICE"
  | "SERVICE_REPORT"
  | "PURCHASE_INVOICE"
  | "ROADSIDE_ASSISTANCE"
  | "OTHER";

const documentTypes: DocumentType[] = [
  "REGISTRATION",
  "INSURANCE",
  "INSPECTION",
  "INVOICE",
  "SERVICE_REPORT",
  "PURCHASE_INVOICE",
  "ROADSIDE_ASSISTANCE",
  "OTHER",
];

type ExistingFile = {
  id: string;
  fileName: string;
  originalName?: string;
};

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocumentType>("REGISTRATION");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypes, setShowTypes] = useState(false);

  // File States
  const [existingFile, setExistingFile] = useState<ExistingFile | null>(null);
  const [newFile, setNewFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/documents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("documents.loadFailed"));
      }

      const doc = data.document || data;

      setType((doc.type as DocumentType) || "OTHER");
      setTitle(doc.title || "");
      
      if (doc.expiresAt) {
        setExpiresAt(new Date(doc.expiresAt));
      }

      // If your API returns the file attached to the document directly
      if (doc.file || doc.fileName) {
        setExistingFile({
          id: doc.fileId || doc.id,
          fileName: doc.fileName || doc.file,
          originalName: doc.originalName || doc.fileName || doc.file,
        });
      }

    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("documents.loadFailed")
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return t("documents.noExpirationDate");

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const formatDateForApi = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setNewFile(result.assets[0]);
    }
  };

  const removeNewFile = () => {
    setNewFile(null);
  };

  const confirmDeleteExistingFile = () => {
    Alert.alert(
      t("common.confirmDelete"),
      t("documents.deleteFileConfirmation", { defaultValue: "Bu dosyayı silmek istediğinize emin misiniz?" }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: deleteExistingFile,
        },
      ]
    );
  };

  const deleteExistingFile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/documents/${id}/file`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t("common.error"));
      }

      setExistingFile(null);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("common.error")
      );
    }
  };

  const updateDocument = async () => {
    if (type === "OTHER" && !title.trim()) {
      Alert.alert(
        t("common.error"),
        t("documents.fillTitle", { defaultValue: "Lütfen belge başlığını girin." })
      );
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();

      formData.append("type", type);

      if (type === "OTHER" && title.trim() !== "") {
        formData.append("title", title.trim());
      } else {
        formData.append("title", type);
      }

      // Appending empty string if date was cleared
      formData.append("expiresAt", formatDateForApi(expiresAt));

      if (newFile) {
        formData.append("file", {
          uri: newFile.uri,
          name: newFile.name,
          type: newFile.mimeType || "application/octet-stream",
        } as any);
      }

      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data?.message || t("documents.updateFailed", { defaultValue: "Belge güncellenemedi." }));
      }

      router.back();
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("documents.updateFailed", { defaultValue: "Belge güncellenemedi." })
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
                  theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
              },
            ]}
          >
            <Ionicons name="create-outline" size={56} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("documents.editTitle", { defaultValue: "Belgeyi Düzenle" })}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("documents.editSubtitle", { defaultValue: "Belge detaylarını aşağıdan güncelleyebilirsiniz." })}
          </Text>

          {/* Form Fields Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                zIndex: 50,
              },
            ]}
          >
            <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
              {t("documents.type")}
            </Text>

            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowTypes(!showTypes)}
            >
              <Text style={[styles.inputText, { color: theme.text }]}>
                {t(`documentTypes.${type}`)}
              </Text>

              <Ionicons
                name={showTypes ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.mutedText}
              />
            </TouchableOpacity>

            {showTypes && (
              <View
                style={[
                  styles.dropdownOverlayType,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {documentTypes.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setType(item);
                      setShowTypes(false);
                      if (item !== "OTHER") setTitle("");
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                      {t(`documentTypes.${item}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {type === "OTHER" && (
              <>
                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
                  {t("documents.title", { defaultValue: "Belge Başlığı" })}
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
                  placeholder={t("documents.titlePlaceholder", {
                    defaultValue: "Belge adı girin...",
                  })}
                  placeholderTextColor={theme.mutedText}
                />
              </>
            )}

            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
              {t("documents.expiresAt")}
            </Text>

            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  color: expiresAt ? theme.text : theme.mutedText,
                  fontWeight: "600",
                }}
              >
                {formatDate(expiresAt)}
              </Text>

              <Ionicons name="calendar-outline" size={20} color={theme.mutedText} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expiresAt ?? new Date()}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setExpiresAt(selectedDate);
                  }
                }}
              />
            )}

            {expiresAt ? (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setExpiresAt(null)}
              >
                <Text style={[styles.clearDateText, { color: theme.mutedText }]}>
                  {t("documents.clearExpirationDate")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* File Management Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                marginTop: 16,
                zIndex: 1,
              },
            ]}
          >
            {/* Existing File Display */}
            {existingFile && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
                  {t("documents.currentFile", { defaultValue: "Mevcut Dosya" })}
                </Text>
                <View
                  style={[
                    styles.fileCard,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.fileInfo}>
                    <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                    <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                      {existingFile.originalName || existingFile.fileName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={confirmDeleteExistingFile}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* New File Display */}
            {newFile && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>
                  {t("documents.newFile", { defaultValue: "Yeni Dosya" })}
                </Text>
                <View
                  style={[
                    styles.fileCard,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.fileInfo}>
                    <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                    <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                      {newFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={removeNewFile}
                  >
                    <Ionicons name="close-circle" size={22} color={theme.mutedText} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Pick File Button */}
            {(!existingFile && !newFile) || (existingFile && !newFile) ? (
              <>
                <View style={styles.optionalLabelRow}>
                  <Text style={[styles.label, { color: theme.text, marginTop: existingFile ? 0 : 0 }]}>
                    {existingFile
                      ? t("documents.replaceFile", { defaultValue: "Dosyayı Değiştir" })
                      : t("documents.file")}
                  </Text>
                  <Text style={[styles.optionalText, { color: theme.mutedText }]}>
                    {t("documents.optional", { defaultValue: "(İsteğe Bağlı)" })}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.fileBox,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      borderStyle: "dashed",
                    },
                  ]}
                  onPress={pickFile}
                >
                  <Ionicons name="cloud-upload-outline" size={28} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fileTitle, { color: theme.text }]}>
                      {t("documents.chooseFile")}
                    </Text>
                    <Text style={[styles.fileSubtitle, { color: theme.mutedText }]}>
                      {t("documents.fileHint")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary, flex: 1 },
                saving && styles.disabledButton,
              ]}
              onPress={updateDocument}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {t("documents.updateDocument", { defaultValue: "Belgeyi Güncelle" })}
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
    marginBottom: 7,
  },
  optionalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "600",
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
  dropdownOverlayType: {
    position: "absolute",
    top: 80,
    left: 18,
    right: 18,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 999,
    elevation: 999,
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontWeight: "600",
  },
  fileBox: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  fileSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
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
  clearDateButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  clearDateText: {
    fontSize: 13,
    fontWeight: "700",
  },
});