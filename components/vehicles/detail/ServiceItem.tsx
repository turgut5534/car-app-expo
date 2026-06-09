import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  return (
    <View
      style={[
        styles.serviceCard,
        { backgroundColor: theme.card, borderColor: theme.border },
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

      <Text style={[styles.serviceCost, { color: theme.text }]}>
        {service.amount} {currency}
      </Text>
    </View>
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
});