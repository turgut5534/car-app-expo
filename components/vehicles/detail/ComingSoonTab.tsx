import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";

export function ComingSoonTab() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.emptyTab,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={{ color: theme.mutedText }}>{t("cars.tabComingSoon")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyTab: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
});