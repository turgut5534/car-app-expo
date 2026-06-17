import { Stack } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VehiclesLayout() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
    </SafeAreaView>
  );
}