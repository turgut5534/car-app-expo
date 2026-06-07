import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function CreatePasswordScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [loading, setLoading] = useState(false);

  const createAccount = async () => {
    if (!email) {
      Alert.alert(t("common.error"), t("register.emailMissing"));
      return;
    }

    if (!password || !passwordAgain) {
      Alert.alert(t("common.error"), t("register.fillAllFields"));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t("common.error"), t("register.passwordTooShort"));
      return;
    }

    if (password !== passwordAgain) {
      Alert.alert(t("common.error"), t("register.passwordsNotMatch"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://YOUR_BACKEND_URL/auth/register", {
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
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : t("register.registerFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logo}>
          <Text style={styles.logoText}>🔐</Text>
        </View>

        <Text style={styles.title}>{t("register.createPasswordTitle")}</Text>
        <Text style={styles.subtitle}>
          {t("register.createPasswordSubtitle")}
        </Text>

        <Text style={styles.label}>{t("auth.email")}</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email ?? ""}
          editable={false}
        />

        <Text style={styles.label}>{t("auth.password")}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t("register.passwordPlaceholder")}
          secureTextEntry
        />

        <Text style={styles.label}>{t("register.passwordAgain")}</Text>
        <TextInput
          style={styles.input}
          value={passwordAgain}
          onChangeText={setPasswordAgain}
          placeholder={t("register.passwordAgainPlaceholder")}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={createAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t("common.loading") : t("register.createAccount")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.bottomText}>
            {t("register.haveAccount")}{" "}
            <Text style={styles.link}>{t("auth.login")}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
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
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#F4F7FD",
    color: "#637083",
  },
  button: {
    height: 56,
    backgroundColor: "#0057E7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  disabledButton: {
    opacity: 0.6,
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
    color: "#637083",
  },
  link: {
    color: "#0057E7",
    fontWeight: "700",
  },
});