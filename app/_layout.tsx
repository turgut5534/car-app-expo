import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initI18n } from "../i18n";
import { AppThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadI18n = async () => {
      await initI18n();
      setReady(true);
    };

    loadI18n();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}