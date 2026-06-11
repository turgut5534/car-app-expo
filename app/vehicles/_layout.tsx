// app/vehicles/_layout.tsx

import { Stack } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";

export default function VehiclesLayout() {
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    />
  );
}