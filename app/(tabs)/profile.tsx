import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  isPremium?: boolean;
};

export default function ProfileScreen() {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch("http://192.168.0.10:3000/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile could not be loaded");
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
    await AsyncStorage.removeItem("accessToken");
    router.replace("/(auth)/login");
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    t("profile.guestUser");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t("profile.title")}</Text>

        <View style={styles.profileCard}>
          {/* <Image
            source={
              user?.avatarUrl
                ? { uri: user.avatarUrl }
                : require("../../assets/images/avatar-placeholder.png")
            }
            style={styles.avatar}
          /> */}

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

        <Text style={styles.sectionTitle}>{t("profile.account")}</Text>

        <View style={styles.menuCard}>
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

        <Text style={styles.sectionTitle}>{t("profile.settings")}</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="cash-outline"
            title={t("profile.unitsCurrency")}
            onPress={() => {}}
          />
          <MenuItem
            icon="moon-outline"
            title={t("profile.theme")}
            rightText={t("profile.light")}
            onPress={() => {}}
          />
          <MenuItem
            icon="globe-outline"
            title={t("profile.language")}
            rightText={t("profile.languageValue")}
            onPress={() => {}}
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
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color="#081331" />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>

      <View style={styles.menuRight}>
        {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        <Ionicons name="chevron-forward" size={20} color="#8A96A8" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#081331",
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
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#E5E7EB",
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
    color: "#081331",
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#081331",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightText: {
    color: "#637083",
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
});