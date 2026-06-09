import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../../context/ThemeContext";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  line1: string;
  line2: string;
};

export function InfoCard({ icon, title, line1, line2 }: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={theme.text} />
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.infoLine1, { color: theme.text }]}>{line1}</Text>

      {line2 ? (
        <Text style={[styles.infoLine2, { color: theme.mutedText }]}>
          {line2}
        </Text>
      ) : null}
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
  infoLine1: {
    marginTop: 8,
    fontWeight: "900",
  },
  infoLine2: {
    marginTop: 4,
    fontWeight: "700",
  },
});