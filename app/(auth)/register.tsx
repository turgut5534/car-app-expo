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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function RegisterScreen() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const continueWithEmail = async () => {
    
    if (!email.trim()) {
      setEmailError(t("register.emailRequired"));
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError(t("register.invalidEmail"));
      return;
    }

    try {
      const response = await fetch("http://192.168.0.10:3000/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      if (data.exists) {
        setEmailError(t("register.emailAlreadyExists"));
        return;
      }

      console.log(data)

      router.push({
        pathname: "/(auth)/create-password",
        params: { email },
      });
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : t("common.error"));
    }

    router.push({
      pathname: "/(auth)/create-password",
      params: { email },
    });
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
          <Text style={styles.logoText}>🚗</Text>
        </View>

        <Text style={styles.title}>{t("register.title")}</Text>

        <Text style={styles.subtitle}>{t("register.subtitle")}</Text>

        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialText}>
            {t("register.continueWithGoogle")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialText}>
            {t("register.continueWithApple")}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t("register.or")}</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.label}>{t("auth.email")}</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t("auth.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={continueWithEmail}>
          <Text style={styles.buttonText}>{t("common.continue")}</Text>
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
    marginBottom: 12,
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
  socialContainer: {
    gap: 12,
    marginBottom: 22,
  },

  socialButton: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D6DCE8",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    margin: 4,
  },

  socialIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: "#081331",
  },

  socialText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#081331",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E3E8F2",
  },

  dividerText: {
    marginHorizontal: 12,
    color: "#8A96A8",
    fontSize: 13,
  },
  errorText: {
    color: "#DC2626",
    marginTop: 6,
    fontSize: 12,
  },
});
