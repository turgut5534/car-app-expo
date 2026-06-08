import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const START_ROUTE = "/(tabs)";
const LOGIN_ROUTE = "/(auth)/login";

export default function OnboardingScreen() {
  const { t } = useTranslation();

  useEffect(() => {}, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🚗</Text>
        </View>
        <Text style={styles.logoText}>{t("welcome.appName")}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {t("welcome.titleLine1")}{" "}
          <Text style={styles.titleBlue}>{t("welcome.titleHighlight")}</Text>{" "}
          {t("welcome.titleLine2")}
        </Text>

        <Text style={styles.desc}>{t("welcome.description")}</Text>

        <View style={styles.visualArea}>
          <View style={[styles.card, styles.cardTop]}>
            <Text style={styles.cardIcon}>🔧</Text>
            <View>
              <Text style={styles.cardTitle}>{t("welcome.cardOil")}</Text>
              <Text style={styles.cardDesc}>15.000 km</Text>
            </View>
            <Text style={styles.check}>✓</Text>
          </View>

          <View style={[styles.card, styles.cardLeft]}>
            <Text style={styles.cardIcon}>🛞</Text>
            <View>
              <Text style={styles.cardTitle}>{t("welcome.cardTire")}</Text>
              <Text style={styles.cardDesc}>15.04.2024</Text>
            </View>
          </View>

          <View style={[styles.card, styles.cardRight]}>
            <Text style={styles.cardIcon}>🧰</Text>
            <View>
              <Text style={styles.cardTitle}>{t("welcome.cardGeneral")}</Text>
              <Text style={styles.cardDesc}>20.000 km</Text>
            </View>
          </View>

          <View style={styles.carCircle}>
            <Text style={styles.carEmoji}>🚘</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/register")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>{t("welcome.start")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>{t("welcome.login")}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>{t("welcome.footerText")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#EAF2FF",
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
    color: "#081331",
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
    color: "#081331",
    textAlign: "center",
    lineHeight: 44,
  },
  titleBlue: {
    color: "#2563EB",
  },
  desc: {
    marginTop: 16,
    fontSize: 16,
    color: "#637083",
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
    backgroundColor: "#EAF4FF",
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    color: "#081331",
  },
  cardDesc: {
    fontSize: 12,
    color: "#637083",
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
    backgroundColor: "#2563EB",
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
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 16,
    textAlign: "center",
    color: "#7B8794",
    fontSize: 13,
  },
});
