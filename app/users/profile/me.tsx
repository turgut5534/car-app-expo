import React, { useState, useEffect } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import { Toast } from "@/components/Toast";

export default function EditProfileScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || t("profile.loadFailed", "Profil yüklenemedi."),
        );

      setName(data.name || "");
      setEmail(data.email || "");
      setCurrentAvatarUrl(data.user?.avatar || null);
    } catch (error) {
      Alert.alert(
        t("common.error", "Hata"),
        error instanceof Error
          ? error.message
          : t("common.error", "Bir hata oluştu"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setNewAvatar(result.assets[0]);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(
        t("common.error", "Hata"),
        t("profile.fillRequired", "Lütfen zorunlu alanları doldurun."),
      );
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());

      if (newAvatar) {
        formData.append("avatar", {
          uri:
            Platform.OS === "android"
              ? newAvatar.uri
              : newAvatar.uri.replace("file://", ""),
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      }

      const response = await fetch(`${API_URL}/users`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok)
        throw new Error(t("profile.updateFailed", "Profil güncellenemedi."));

      setToast({ visible: false, message: "", type: "success" });
      setTimeout(() => {
        setToast({
          visible: true,
          message: "Profile updated",
          type: "success",
        });
      }, 50);
    } catch (error) {
      setToast({ visible: false, message: "", type: "error" });
      setTimeout(() => {
        setToast({ visible: true, message: "Profile update failed", type: "error" });
      }, 50);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );

  const displayAvatar = newAvatar
    ? { uri: newAvatar.uri }
    : currentAvatarUrl
      ? { uri: `${API_URL}/uploads/avatars/${currentAvatarUrl}` }
      : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("profile.editProfileTitle", "Profili Düzenle")}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.avatarContainer}
            >
              {displayAvatar ? (
                <Image source={displayAvatar} style={styles.avatarImage} />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <Ionicons name="person" size={50} color={theme.mutedText} />
                </View>
              )}
              <View
                style={[
                  styles.editIconBadge,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: theme.primary }]}>
              {t("profile.changePhoto", "Fotoğrafı Değiştir")}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                {t("profile.firstName", "Ad")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                {t("profile.email", "E-posta")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {t("common.save", "Kaydet")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  avatarSection: { alignItems: "center", marginTop: 10, marginBottom: 30 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  changePhotoText: { marginTop: 12, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 18, padding: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  footer: { padding: 24, borderTopWidth: 1 },
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
