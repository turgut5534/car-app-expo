import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";
import { API_URL } from "@/constants/api";
import { Toast } from "@/components/Toast";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type User = {
  name: string;
  email?: string;
  picture?: string;
  isPremium?: boolean;
  currency?: string; // Added currency to track the selected one
};

type ThemeMode = "light" | "dark" | "system";

const languageMap: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  pl: "Polski",
};

const themeOptions: {
  code: ThemeMode;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { code: "light", icon: "sunny-outline" },
  { code: "dark", icon: "moon-outline" },
  { code: "system", icon: "phone-portrait-outline" },
];

const languageOptions = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "pl", label: "Polski" },
];

const currencyOptions = [
  { code: "PLN", label: "PLN" },
  { code: "EUR", label: "EUR" },
  { code: "USD", label: "USD" },
  { code: "GBP", label: "GBP" },
  { code: "TRY", label: "TRY" },
  { code: "CHF", label: "CHF" },
  { code: "CZK", label: "CZK" },
  { code: "HUF", label: "HUF" },
  { code: "RON", label: "RON" },
  { code: "BGN", label: "BGN" },
  { code: "SEK", label: "SEK" },
  { code: "NOK", label: "NOK" },
  { code: "DKK", label: "DKK" },
  { code: "AUD", label: "AUD" },
  { code: "CAD", label: "CAD" },
  { code: "JPY", label: "JPY" },
  { code: "CNY", label: "CNY" },
];

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, mode, changeTheme } = useAppTheme();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  const setCurrency = async (code: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      // Optimistic UI update
      if (user) setUser({ ...user, currency: code });

      const response = await fetch("http://192.168.0.10:3000/users/currency", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.loadFailed"));
      }

      setToast({ visible: false, message: "", type: "success" });
      setTimeout(() => {
        setToast({
          visible: true,
          message: t("profile.currencyUpdated", "Currency updated"),
          type: "success",
        });
      }, 50);
    } catch (e) {
      // Revert on failure (simplified)
      fetchProfile();
    }
  };

  const currentLanguage =
    languageMap[(selectedLanguage ?? "en").split("-")[0]] ?? "English";

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch("http://192.168.0.10:3000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.loadFailed"));
      }

      setUser(data);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("profile.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    Alert.alert(t("profile.logoutTitle"), t("profile.logoutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>
          {t("profile.title")}
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            {user?.picture ? (
              <Image
                source={{ uri: `${API_URL}/../uploads/users/${user.picture}` }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color="#999" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name ?? "Anonymous"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.isPremium && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ {t("profile.premium")}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("profile.account")}
        </Text>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <MenuItem
            icon="person-outline"
            title={t("profile.profileInformation")}
            onPress={() => router.push("/users/profile/me")}
          />
          <MenuItem
            icon="car-outline"
            title={t("profile.myCars")}
            onPress={() => router.push("/vehicles")}
          />
          <MenuItem
            icon="people-outline"
            title={t("profile.myFamily")}
            onPress={() => router.push("/users/family")}
          />
          <MenuItem
            icon="notifications-outline"
            title={t("profile.notifications")}
            onPress={() => {}}
          />
          <MenuItem
            icon="cloud-upload-outline"
            title={t("profile.backupSync")}
            onPress={() => {}}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("profile.settings")}
        </Text>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <MenuItem
            icon="cash-outline"
            title={t("profile.unitsCurrency")}
            rightText={user?.currency}
            onPress={() => setCurrencyModalVisible(true)}
          />
          <MenuItem
            icon="moon-outline"
            title={t("profile.theme")}
            rightText={t(`theme.${mode}`)}
            onPress={() => setThemeModalVisible(true)}
          />
          <MenuItem
            icon="globe-outline"
            title={t("profile.language")}
            rightText={currentLanguage}
            onPress={() => setLanguageModalVisible(true)}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title={t("profile.privacySecurity")}
            onPress={() => {}}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>{t("profile.logout")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- THEME MODAL --- */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: theme.card }]}>
              <View
                style={[styles.sheetHandle, { backgroundColor: theme.border }]}
              />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {t("profile.theme")}
              </Text>

              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
              >
                {themeOptions.map((item) => {
                  const isSelected = mode === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[
                        styles.option,
                        isSelected && { backgroundColor: `${theme.primary}15` },
                      ]}
                      onPress={async () => {
                        await changeTheme(item.code);
                        setThemeModalVisible(false);
                      }}
                    >
                      <View style={styles.optionLeft}>
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={isSelected ? theme.primary : theme.text}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: isSelected ? theme.primary : theme.text },
                          ]}
                        >
                          {t(`theme.${item.code}`)}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* --- CURRENCY MODAL --- */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: theme.card }]}>
              <View
                style={[styles.sheetHandle, { backgroundColor: theme.border }]}
              />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {t("profile.unitsCurrency", "Currency")}
              </Text>

              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={true}
              >
                {currencyOptions.map((item) => {
                  const isSelected = user?.currency === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[
                        styles.option,
                        isSelected && { backgroundColor: `${theme.primary}15` },
                      ]}
                      onPress={async () => {
                        setCurrency(item.code);
                        setCurrencyModalVisible(false);
                      }}
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            styles.currencyAvatar,
                            {
                              backgroundColor: isSelected
                                ? theme.primary
                                : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencySymbol,
                              { color: isSelected ? "#fff" : theme.text },
                            ]}
                          >
                            {item.code.charAt(0)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: isSelected ? theme.primary : theme.text },
                          ]}
                        >
                          {item.code}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* --- LANGUAGE MODAL --- */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: theme.card }]}>
              <View
                style={[styles.sheetHandle, { backgroundColor: theme.border }]}
              />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {t("profile.language")}
              </Text>

              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
              >
                {languageOptions.map((lang) => {
                  const isSelected =
                    selectedLanguage.split("-")[0] === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.option,
                        isSelected && { backgroundColor: `${theme.primary}15` },
                      ]}
                      onPress={async () => {
                        await AsyncStorage.setItem("systemLanguage", lang.code);
                        await i18n.changeLanguage(lang.code);
                        setSelectedLanguage(lang.code);
                        setLanguageModalVisible(false);
                      }}
                    >
                      <View style={styles.optionLeft}>
                        <Ionicons
                          name="language-outline"
                          size={22}
                          color={isSelected ? theme.primary : theme.text}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: isSelected ? theme.primary : theme.text },
                          ]}
                        >
                          {lang.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  title,
  rightText,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  rightText?: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.border }]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={theme.text} />
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {rightText && (
          <Text style={[styles.rightText, { color: theme.mutedText }]}>
            {rightText}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={theme.mutedText} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 37 },
  profileInfo: { flex: 1 },
  name: { color: "#fff", fontSize: 21, fontWeight: "800" },
  email: { color: "#EAF2FF", marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  menuCard: {
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuTitle: { fontSize: 15, fontWeight: "700" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rightText: { fontWeight: "600" },
  logoutButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#FEECEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
  },
  logoutText: { color: "#EF4444", fontWeight: "800", fontSize: 16 },

  // Modal & Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  sheetScroll: { maxHeight: SCREEN_HEIGHT * 0.55 },

  // Option Item Styles
  option: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  optionLabel: { fontSize: 16, fontWeight: "600" },
  currencyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  currencySymbol: { fontSize: 14, fontWeight: "800" },
});
