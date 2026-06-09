import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  title: string;
  value: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

export function StatCard({ title, value, sub, icon, accent }: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={accent} />
      <Text style={[styles.cardTitle, { color: theme.mutedText }]}>
        {title}
      </Text>
      <Text style={[styles.cardValue, { color: accent }]}>{value}</Text>
      <Text style={[styles.cardSub, { color: accent }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 128,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
  },
  cardValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "900",
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },
});