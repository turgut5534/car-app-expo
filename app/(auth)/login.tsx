import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem("token");

    console.log(token);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async () => {
    try {
      setError("");
      setLoading(true);

      const response = await fetch("http://192.168.0.10:3000/auth/login", {
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
        setError(data.message || "Login failed");
        return;
      }

      await AsyncStorage.setItem("token", data.accessToken);

      router.replace("/home");
    } catch (e) {
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>🚗</Text>
        </View>

        <Text style={styles.title}>{t("auth.welcome")}</Text>

        <Text style={styles.subtitle}>{t("auth.loginSubtitle")}</Text>

        <Text style={styles.label}>{t("auth.email")}</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t("auth.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t("auth.password")}</Text>

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t("auth.passwordPlaceholder")}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
        >
          <Text style={styles.forgot}>{t("auth.forgotPassword")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={login}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t("common.loading") : t("auth.login")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.register}>
            {t("auth.noAccount")}{" "}
            <Text style={styles.link}>{t("auth.register")}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#0057E7",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#081331",
  },
  subtitle: {
    textAlign: "center",
    color: "#637083",
    marginTop: 8,
    marginBottom: 32,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
    fontWeight: "600",
    color: "#081331",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D6DCE8",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  forgot: {
    color: "#0057E7",
    textAlign: "right",
    marginTop: 12,
  },
  button: {
    height: 56,
    backgroundColor: "#0057E7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  register: {
    textAlign: "center",
    marginTop: 24,
    color: "#637083",
  },
  link: {
    color: "#0057E7",
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626",
    marginTop: 8,
  },
});
