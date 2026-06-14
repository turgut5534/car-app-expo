import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAppTheme } from "../../../context/ThemeContext";
import { Service } from "../../../types/car";

type Props = {
  service: Service;
  currency: string;
};

export function ServiceItem({ service, currency }: Props) {
  const { theme } = useAppTheme();

  const iconMap = {
    oil: "water-outline",
    brake: "disc-outline",
    filter: "options-outline",
    spark: "flash-outline",
    coolant: "battery-charging-outline",
  } as const;

  const iconName = iconMap[service.type ?? "oil"];

  const handlePress = () => {
    router.push({
      pathname: "/vehicles/services/[id]/details",
      params: { id: service.id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.serviceCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.serviceLeft}>
        <View
          style={[
            styles.serviceIconBox,
            {
              backgroundColor:
                theme.activeMode === "dark" ? "#172554" : "#EEF4FF",
            },
          ]}
        >
          <Ionicons name={iconName} size={24} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.serviceTitle, { color: theme.text }]}>
            {service.title}
          </Text>

          <Text style={[styles.serviceMeta, { color: theme.mutedText }]}>
            {new Date(service.serviceDate).toLocaleDateString("tr-TR")} ·{" "}
            {service.km?.toLocaleString()} km
          </Text>
        </View>
      </View>

      {/* RIGHT SIDE */}
      <View style={styles.rightSide}>
        <Text style={[styles.serviceCost, { color: theme.text }]}>
          {service.amount} {currency}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.mutedText}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  serviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  serviceMeta: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
  },
  serviceCost: {
    fontWeight: "900",
  },
  rightSide: {
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 6,
},
});