import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme, lightTheme } from "../constants/theme";

type ThemeMode = "light" | "dark" | "system";

const ThemeContext = createContext<any>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem("theme");

      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }
    };

    loadTheme();
  }, []);

  const activeMode =
    mode === "system" ? systemScheme ?? "light" : mode;

  const theme = activeMode === "dark" ? darkTheme : lightTheme;

  const changeTheme = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem("theme", newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, activeMode, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}