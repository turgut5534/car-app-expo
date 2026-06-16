import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const continueWithEmail = async () => {
    setEmailError("");

    if (!email.trim()) {
      setEmailError(t("register.emailRequired"));
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError(t("register.invalidEmail"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://192.168.0.10:3000/auth/check-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("common.error"));
      }

      if (data.exists) {
        setEmailError(t("register.emailAlreadyExists"));
        return;
      }

      router.push({
        pathname: "/(auth)/create-password",
        params: {
          email: email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

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
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.back, { color: theme.text }]}>‹</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>🚗</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("register.title")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {t("register.subtitle")}
          </Text>

          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.socialText, { color: theme.text }]}>
              {t("register.continueWithGoogle")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.socialText, { color: theme.text }]}>
              {t("register.continueWithApple")}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.mutedText }]}>
              {t("register.or")}
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <Text style={[styles.label, { color: theme.text }]}>
            {t("auth.email")}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                borderColor: emailError ? "#DC2626" : theme.border,
                color: theme.text,
              },
            ]}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (emailError) setEmailError("");
            }}
            placeholder={t("auth.emailPlaceholder")}
            placeholderTextColor={theme.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
              loading && styles.disabledButton,
            ]}
            onPress={continueWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t("common.continue")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.bottomText, { color: theme.mutedText }]}>
              {t("register.haveAccount")}{" "}
              <Text style={[styles.link, { color: theme.primary }]}>
                {t("auth.login")}
              </Text>
            </Text>
          </TouchableOpacity>
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
  header: {
    marginTop: 8,
    marginBottom: 12,
  },
  back: {
    fontSize: 34,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 26,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  bottomText: {
    textAlign: "center",
    marginTop: 22,
    marginBottom: 24,
  },
  link: {
    fontWeight: "700",
  },
  socialButton: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: 4,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },
  errorText: {
    color: "#DC2626",
    marginTop: 6,
    fontSize: 12,
  },
});
