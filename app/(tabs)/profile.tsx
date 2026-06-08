import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";

type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  isPremium?: boolean;
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

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, mode, changeTheme } = useAppTheme();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.loadFailed"));
      }

      setUser(data);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("profile.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    t("profile.guestUser");

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
            <Ionicons name="person" size={42} color="#FFFFFF" />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>

            {user?.isPremium ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ {t("profile.premium")}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("profile.account")}
        </Text>

        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <MenuItem
            icon="person-outline"
            title={t("profile.profileInformation")}
            onPress={() => {}}
          />

          <MenuItem
            icon="car-outline"
            title={t("profile.myCars")}
            onPress={() => router.push("/vehicles")}
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
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <MenuItem
            icon="cash-outline"
            title={t("profile.unitsCurrency")}
            onPress={() => {}}
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

      <Modal
        visible={themeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {t("profile.theme")}
            </Text>

            {themeOptions.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[styles.option, { borderBottomColor: theme.border }]}
                onPress={async () => {
                  await changeTheme(item.code);
                  setThemeModalVisible(false);
                }}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name={item.icon} size={22} color={theme.text} />
                  <Text style={[styles.optionLabel, { color: theme.text }]}>
                    {t(`theme.${item.code}`)}
                  </Text>
                </View>

                {mode === item.code ? (
                  <Ionicons name="checkmark" size={22} color={theme.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {t("profile.language")}
            </Text>

            {languageOptions.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.option, { borderBottomColor: theme.border }]}
                onPress={async () => {
                  await AsyncStorage.setItem("systemLanguage", lang.code);
                  await i18n.changeLanguage(lang.code);
                  setSelectedLanguage(lang.code);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  {lang.label}
                </Text>

                {selectedLanguage.split("-")[0] === lang.code ? (
                  <Ionicons name="checkmark" size={22} color={theme.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
        {rightText ? (
          <Text style={[styles.rightText, { color: theme.mutedText }]}>
            {rightText}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={theme.mutedText} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  profileInfo: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "800",
  },
  email: {
    color: "#EAF2FF",
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
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
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightText: {
    fontWeight: "600",
  },
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
  logoutText: {
    color: "#EF4444",
    fontWeight: "800",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
  },
  option: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});