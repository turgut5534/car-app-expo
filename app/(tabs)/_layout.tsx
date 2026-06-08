import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme, activeMode } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedText,

        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehicles"
        options={{
          title: t("tabs.myCars"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-expense"
        options={{
          title: "",

          tabBarIcon: () => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.primary,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 30,

                shadowColor: "#000",
                shadowOpacity: activeMode === "dark" ? 0.3 : 0.15,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <Ionicons
                name="add"
                size={32}
                color="#FFFFFF"
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: t("tabs.reports"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}