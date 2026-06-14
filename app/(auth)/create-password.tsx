import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Errors = {
  email?: string;
  password?: string;
  passwordAgain?: string;
  general?: string;
};

export default function CreatePasswordScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const createAccount = async () => {
    const nextErrors: Errors = {};

    if (!email) {
      nextErrors.email = t("register.emailMissing");
    }

    if (!password) {
      nextErrors.password = t("register.fillAllFields");
    } else if (password.length < 8) {
      nextErrors.password = t("register.passwordTooShort");
    }

    if (!passwordAgain) {
      nextErrors.passwordAgain = t("register.fillAllFields");
    } else if (password !== passwordAgain) {
      nextErrors.passwordAgain = t("register.passwordsNotMatch");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await fetch("http://192.168.0.10:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("register.registerFailed"));
      }

      await AsyncStorage.setItem("token", data.accessToken);

      router.replace("/(tabs)/home");

    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : t("register.registerFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.text }]}>‹</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <Text style={styles.logoText}>🔐</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {t("register.createPasswordTitle")}
        </Text>

        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          {t("register.createPasswordSubtitle")}
        </Text>

        <Text style={[styles.label, { color: theme.text }]}>
          {t("auth.email")}
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor:
                theme.activeMode === "dark" ? "#1E293B" : "#F4F7FD",
              borderColor: errors.email ? "#EF4444" : theme.border,
              color: theme.mutedText,
            },
          ]}
          value={email ?? ""}
          editable={false}
          placeholderTextColor={theme.mutedText}
        />

        {errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}

        <Text style={[styles.label, { color: theme.text }]}>
          {t("auth.password")}
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor:
                errors.password && theme.activeMode !== "dark"
                  ? "#FFF7F7"
                  : theme.card,
              borderColor: errors.password ? "#EF4444" : theme.border,
              color: theme.text,
            },
          ]}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((prev) => ({
              ...prev,
              password: undefined,
              general: undefined,
            }));
          }}
          placeholder={t("register.passwordPlaceholder")}
          placeholderTextColor={theme.mutedText}
          secureTextEntry
        />

        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}

        <Text style={[styles.label, { color: theme.text }]}>
          {t("register.passwordAgain")}
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor:
                errors.passwordAgain && theme.activeMode !== "dark"
                  ? "#FFF7F7"
                  : theme.card,
              borderColor: errors.passwordAgain ? "#EF4444" : theme.border,
              color: theme.text,
            },
          ]}
          value={passwordAgain}
          onChangeText={(text) => {
            setPasswordAgain(text);
            setErrors((prev) => ({
              ...prev,
              passwordAgain: undefined,
              general: undefined,
            }));
          }}
          placeholder={t("register.passwordAgainPlaceholder")}
          placeholderTextColor={theme.mutedText}
          secureTextEntry
        />

        {errors.passwordAgain ? (
          <Text style={styles.errorText}>{errors.passwordAgain}</Text>
        ) : null}

        {errors.general ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#450A0A" : "#FEF2F2",
                borderColor:
                  theme.activeMode === "dark" ? "#7F1D1D" : "#FECACA",
              },
            ]}
          >
            <Text style={styles.errorBoxText}>{errors.general}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.disabledButton,
          ]}
          onPress={createAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {t("register.createAccount")}
            </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
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
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    marginLeft: 4,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  errorBoxText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  bottomText: {
    textAlign: "center",
    marginTop: 22,
  },
  link: {
    fontWeight: "700",
  },
});