import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import * as DocumentPicker from "expo-document-picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [newAttachments, setNewAttachments] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);

  // Viewer States
  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialViewerIndex, setInitialViewerIndex] = useState(0);
  const viewerRef = useRef<FlatList>(null);

  // Combined array for displaying and swiping
  const allCombinedFiles = [
    ...existingFiles.map((f) => ({ ...f, fileType: "existing" })),
    ...newFiles.map((f, i) => ({ ...f, fileType: "new", newIndex: i })),
  ];

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: true,
    });

    if (!result.canceled) {
      setNewAttachments((prev) => [...prev, ...result.assets]);
    }
  };

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const doc = data.document || data;
      setType(doc.type || "OTHER");
      setTitle(doc.title || "");
      if (doc.expiresAt) setExpiresAt(new Date(doc.expiresAt));
      if (doc.attachments) setExistingFiles(doc.attachments);
    } catch (e) {
      Alert.alert(t("common.error"), t("documents.loadFailed"));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteExistingFile = (fileId: string) => {
    Alert.alert(
      t("common.confirm", "Emin misiniz?"),
      t(
        "documents.confirmDelete",
        "Bu dosyayı silmek istediğinize emin misiniz?",
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.delete", "Sil"),
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              // UPDATE THIS ENDPOINT IF NECESSARY based on your backend routes
              const res = await fetch(
                `${API_URL}/documents/${id}/attachments/${fileId}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                },
              );

              if (!res.ok) throw new Error("Delete failed");

              setExistingFiles((prev) =>
                prev.filter((f) => f._id !== fileId && f.id !== fileId),
              );
            } catch (error) {
              Alert.alert(
                t("common.error"),
                t("documents.deleteError", "Dosya silinemedi."),
              );
            }
          },
        },
      ],
    );
  };

  const updateDocument = async () => {

    if (type === "OTHER" && !title.trim()) {
      Alert.alert(
        t("common.error"),
        t("documents.fillTitle", "Lütfen başlık girin."),
      );
      return;
    }
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", type === "OTHER" ? title.trim() : type);
      formData.append(
        "expiresAt",
        expiresAt ? expiresAt.toISOString().split("T")[0] : "",
      );

      if (newAttachments.length > 0) {
        newAttachments.forEach((file) => {
          formData.append("files", {
            uri: file.uri,
            name: file.name ?? "file",
            type: file.mimeType || "application/octet-stream",
          } as any);
        });
      }

      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      console.log("Update response:", data);
      setSaving(false);
      if (res.ok) router.back();
      else Alert.alert(t("common.error"), t("documents.updateFailed"));
    } catch (error) {
      setSaving(false);
      console.error("Update error:", error);
      Alert.alert(t("common.error"), t("documents.updateFailed"));
    }
  };

  if (loading)
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={router.back}>
            <Ionicons name="close" size={26} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {t("documents.editTitle", "Belgeyi Düzenle")}
        </Text>

        {/* Form Fields Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.text }]}>
            {t("documents.type")}
          </Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.border }]}
            onPress={() => setShowTypes(!showTypes)}
          >
            <Text style={{ color: theme.text }}>
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
                styles.dropdown,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {documentTypes.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setType(item);
                    setShowTypes(false);
                  }}
                >
                  <Text style={{ color: theme.text }}>
                    {t(`documentTypes.${item}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {type === "OTHER" && (
            <>
              <Text
                style={[styles.label, { color: theme.text, marginTop: 16 }]}
              >
                {t("documents.title")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Title..."
                placeholderTextColor={theme.mutedText}
              />
            </>
          )}

          <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
            {t("documents.expiresAt")}
          </Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: expiresAt ? theme.text : theme.mutedText }}>
              {expiresAt
                ? expiresAt.toLocaleDateString("pl-PL")
                : t("documents.noExpirationDate")}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.mutedText}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expiresAt ?? new Date()}
              mode="date"
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setExpiresAt(d);
              }}
            />
          )}
        </View>

        {/* File Management */}
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
          <Text style={[styles.label, { color: theme.text }]}>
            {t("documents.files", "Dosyalar")}
          </Text>
          <FlatList
            horizontal
            data={allCombinedFiles}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const isPdf =
                item.fileName?.endsWith(".pdf") || item.name?.endsWith(".pdf");
              const uri =
                item.fileType === "existing"
                  ? `${API_URL}/uploads/documents/${item.fileName}`
                  : item.uri;

              return (
                <View style={styles.thumbnailWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.slideContent,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      setInitialViewerIndex(index);
                      setViewerVisible(true);
                    }}
                  >
                    {isPdf ? (
                      <Ionicons
                        name="document-text"
                        size={40}
                        color="#EF4444"
                      />
                    ) : (
                      <Image source={{ uri }} style={styles.imageThumbnail} />
                    )}
                  </TouchableOpacity>

                  {/* Delete Button overlaid on the image wrapper */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      if (item.fileType === "existing") {
                        deleteExistingFile(item._id || item.id);
                      } else {
                        setNewFiles(
                          newFiles.filter((_, i) => i !== item.newIndex),
                        );
                      }
                    }}
                  >
                    <Ionicons name="trash" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {newAttachments.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { color: theme.text }]}>
                {t("services.newFiles")}
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

          <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
            {t("services.addNewFiles")} ({t("common.optional")})
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
              {t("services.uploadFiles")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={updateDocument}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("common.save")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Full-Screen Image / Document Swiper Modal */}
      <Modal visible={viewerVisible} transparent={true} animationType="fade">
        <View style={styles.viewerContainer}>
          <SafeAreaView style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => setViewerVisible(false)}
              style={styles.closeViewerBtn}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          <FlatList
            ref={viewerRef}
            data={allCombinedFiles}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialViewerIndex}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              const isPdf =
                item.fileName?.endsWith(".pdf") || item.name?.endsWith(".pdf");
              const uri =
                item.fileType === "existing"
                  ? `${API_URL}/uploads/documents/${item.fileName}`
                  : item.uri;

              return (
                <View style={[styles.viewerItem, { width: SCREEN_WIDTH }]}>
                  {isPdf ? (
                    <View style={styles.pdfPlaceholder}>
                      <Ionicons
                        name="document-text"
                        size={100}
                        color="#EF4444"
                      />
                      <Text style={styles.pdfText}>
                        {item.fileName || item.name}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri }}
                      style={styles.viewerImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
  },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdown: {
    position: "absolute",
    top: 80,
    left: 18,
    right: 18,
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 10,
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderColor: "#ccc" },
  thumbnailWrapper: {
    position: "relative",
    marginHorizontal: 6,
  },
  slideContent: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageThumbnail: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
  },
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: "#fff", fontWeight: "700" },

  // Viewer Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  viewerHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
    alignItems: "flex-end",
    padding: 16,
  },
  closeViewerBtn: {
    padding: 8,
  },
  viewerItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
  pdfPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  pdfText: {
    color: "#FFF",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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

  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
});
