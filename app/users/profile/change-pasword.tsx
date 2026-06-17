import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import { Toast } from "@/components/Toast";

export default function ChangePasswordScreen() {
  const { theme } = useAppTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "",
  });

  const handleSubmit = async () => {
    console.log(confirmPassword == newPassword);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ visible: false, message: "", type: "error" });
      setTimeout(() => {
        setToast({
          visible: true,
          message: "Please fill in all fields",
          type: "error",
        });
      }, 50);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ visible: false, message: "", type: "error" });
      setTimeout(() => {
        setToast({
          visible: true,
          message: "Passwords do not match",
          type: "error",
        });
      }, 50);
      return;
    }

    if (newPassword.length < 6) {
      setToast({ visible: false, message: "", type: "error" });
      setTimeout(() => {
        setToast({
          visible: true,
          message: "Password must be at least 6 characters",
          type: "error",
        });
      }, 50);
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setToast({
        visible: true,
        message: "Profile updated",
        type: "success",
      });

      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (err) {
      setToast({ visible: false, message: "", type: "error" });
      setTimeout(() => {
        setToast({
          visible: true,
          message: err instanceof Error ? err.message : "Something went wrong",
          type: "error",
        });
      }, 50);
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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]}>
            Change Password
          </Text>

          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* INFO CARD */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={theme.primary}
            />
            <Text style={[styles.infoText, { color: theme.mutedText }]}>
              For your security, please enter your current password before
              setting a new one.
            </Text>
          </View>

          {/* FORM */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              setValue={setCurrentPassword}
              theme={theme}
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              setValue={setNewPassword}
              theme={theme}
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              setValue={setConfirmPassword}
              theme={theme}
            />
          </View>

          {/* REQUIREMENTS */}
          <View style={styles.hints}>
            <Text style={[styles.hintText, { color: theme.mutedText }]}>
              • Minimum 6 characters{"\n"}• Use a strong unique password{"\n"}•
              Avoid reused passwords
            </Text>
          </View>
        </ScrollView>

        {/* BUTTON */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* 🔁 Reusable input */
function PasswordInput({ label, value, setValue, theme }: any) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          secureTextEntry={hidden}
          style={[styles.input, { color: theme.text }]}
          placeholder="••••••••"
          placeholderTextColor={theme.mutedText}
        />

        <TouchableOpacity onPress={() => setHidden(!hidden)}>
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme.mutedText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  infoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "space-between",
  },

  input: {
    flex: 1,
    fontSize: 15,
  },

  hints: {
    marginTop: 18,
    paddingHorizontal: 4,
  },

  hintText: {
    fontSize: 12,
    lineHeight: 18,
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
  },

  button: {
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
