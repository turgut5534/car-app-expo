import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

type Errors = {
  email?: string;
  password?: string;
  passwordAgain?: string;
  general?: string;
};

export default function CreatePasswordScreen() {
  const { t } = useTranslation();
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logo}>
          <Text style={styles.logoText}>🔐</Text>
        </View>

        <Text style={styles.title}>
          {t("register.createPasswordTitle")}
        </Text>

        <Text style={styles.subtitle}>
          {t("register.createPasswordSubtitle")}
        </Text>

        <Text style={styles.label}>{t("auth.email")}</Text>

        <TextInput
          style={[
            styles.input,
            styles.disabledInput,
            errors.email && styles.inputError,
          ]}
          value={email ?? ""}
          editable={false}
        />

        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}

        <Text style={styles.label}>{t("auth.password")}</Text>

        <TextInput
          style={[
            styles.input,
            errors.password && styles.inputError,
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
          secureTextEntry
        />

        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        <Text style={styles.label}>
          {t("register.passwordAgain")}
        </Text>

        <TextInput
          style={[
            styles.input,
            errors.passwordAgain && styles.inputError,
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
          secureTextEntry
        />

        {errors.passwordAgain && (
          <Text style={styles.errorText}>
            {errors.passwordAgain}
          </Text>
        )}

        {errors.general && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>
              {errors.general}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={createAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? t("common.loading")
              : t("register.createAccount")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.bottomText}>
            {t("register.haveAccount")}{" "}
            <Text style={styles.link}>
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
    backgroundColor: "#FFFFFF",
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
    color: "#081331",
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "#0057E7",
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
    color: "#081331",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#637083",
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 26,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#081331",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D6DCE8",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  disabledInput: {
    backgroundColor: "#F4F7FD",
    color: "#637083",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF7F7",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    marginLeft: 4,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  errorBoxText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    height: 56,
    backgroundColor: "#0057E7",
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
    color: "#637083",
  },
  link: {
    color: "#0057E7",
    fontWeight: "700",
  },
});