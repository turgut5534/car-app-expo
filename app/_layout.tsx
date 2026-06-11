import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { initI18n } from "../i18n";
import { AppThemeProvider, useAppTheme } from "../context/ThemeContext";

function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={theme.background}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
          animation: "fade",
        }}
      />
    </View>
  );
}

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
        <RootNavigator />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}