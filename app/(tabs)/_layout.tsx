import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../context/ThemeContext";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  return (
    <>
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
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.plusWrapper}
                onPress={() => setQuickAddVisible(true)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.plusButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="add" size={34} color="#fff" />
                </View>
              </TouchableOpacity>
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
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <Modal visible={quickAddVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.overlay}
          onPress={() => setQuickAddVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { backgroundColor: theme.card }]}
          >
            <View style={styles.handle} />

            <Text style={[styles.title, { color: theme.text }]}>
              {t("quickAdd.title")}
            </Text>

            <QuickAddItem
              icon="water-outline"
              iconColor="#22C55E"
              title={t("quickAdd.addFuel")}
              subtitle={t("quickAdd.addFuelSubtitle")}
              onPress={() => {
                setQuickAddVisible(false);
                router.push("/vehicles/fuels/create");
              }}
            />

            <QuickAddItem
              icon="construct-outline"
              iconColor="#22C55E"
              title={t("quickAdd.addService")}
              subtitle={t("quickAdd.addServiceSubtitle")}
              onPress={() => {
                setQuickAddVisible(false);
                router.push("/vehicles/services/create");
              }}
            />

            <QuickAddItem
              icon="receipt-outline"
              iconColor="#F97316"
              title={t("quickAdd.addExpense")}
              subtitle={t("quickAdd.addExpenseSubtitle")}
              onPress={() => {
                setQuickAddVisible(false);
                router.push("/vehicles/expenses/create");
              }}
            />

            <QuickAddItem
              icon="document-text-outline"
              iconColor="#64748B"
              title={t("quickAdd.addDocument")}
              subtitle={t("quickAdd.addDocumentSubtitle")}
              onPress={() => {
                setQuickAddVisible(false);
                router.push("/vehicles/documents/create");
              }}
            />

            <QuickAddItem
              icon="car-outline"
              iconColor={theme.primary}
              title={t("quickAdd.addCar")}
              subtitle={t("quickAdd.addCarSubtitle")}
              onPress={() => {
                setQuickAddVisible(false);
                router.push("/vehicles/create");
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setQuickAddVisible(false)}
          >
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function QuickAddItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.quickItem, { borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.itemSubtitle, { color: theme.mutedText }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  plusWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  plusButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  sheet: {
    width: "100%",
    borderRadius: 18,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: "hidden",
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  closeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
});