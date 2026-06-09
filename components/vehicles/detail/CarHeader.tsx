import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../../context/ThemeContext";
import { CarDetail } from "../../../types/car";

type Props = {
  car: CarDetail;
};

export function CarHeader({ car }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <Text style={[styles.pageTitle, { color: theme.text }]}>
        {car.brand || ""} {car.model || car.name}
      </Text>

      <TouchableOpacity>
        <Ionicons name="settings-outline" size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
});