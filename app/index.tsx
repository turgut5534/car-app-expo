import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../context/ThemeContext";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        router.replace("/home");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  if (checkingAuth) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.logoBox,
            {
              backgroundColor:
                theme.activeMode === "dark" ? "#172554" : "#EAF2FF",
            },
          ]}
        >
          <Text style={styles.logoIcon}>🚗</Text>
        </View>

        <Text style={[styles.logoText, { color: theme.text }]}>
          {t("welcome.appName")}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("welcome.titleLine1")}{" "}
          <Text style={{ color: theme.primary }}>
            {t("welcome.titleHighlight")}
          </Text>{" "}
          {t("welcome.titleLine2")}
        </Text>

        <Text style={[styles.desc, { color: theme.mutedText }]}>
          {t("welcome.description")}
        </Text>

        <View style={styles.visualArea}>
          <View
            style={[
              styles.card,
              styles.cardTop,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.cardIcon}>🔧</Text>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t("welcome.cardOil")}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.mutedText }]}>
                15.000 km
              </Text>
            </View>
            <Text style={styles.check}>✓</Text>
          </View>

          <View
            style={[
              styles.card,
              styles.cardLeft,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.cardIcon}>🛞</Text>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t("welcome.cardTire")}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.mutedText }]}>
                15.04.2024
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              styles.cardRight,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.cardIcon}>🧰</Text>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t("welcome.cardGeneral")}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.mutedText }]}>
                20.000 km
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.carCircle,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#172554" : "#EAF4FF",
              },
            ]}
          >
            <Text style={styles.carEmoji}>🚘</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/(auth)/register")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>{t("welcome.start")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              borderColor: theme.primary,
              backgroundColor: theme.card,
            },
          ]}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
            {t("welcome.login")}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: theme.mutedText }]}>
          {t("welcome.footerText")}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 32,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 44,
  },
  desc: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  visualArea: {
    width: "100%",
    height: 300,
    marginTop: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  carCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  carEmoji: {
    fontSize: 110,
  },
  card: {
    position: "absolute",
    zIndex: 2,
    minWidth: 145,
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardTop: {
    top: 10,
  },
  cardLeft: {
    left: 0,
    top: 115,
  },
  cardRight: {
    right: 0,
    top: 145,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  check: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "900",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 13,
  },
});