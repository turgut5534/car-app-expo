import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { CarTabKey } from "../../../types/car";

type Props = {
  activeTab: CarTabKey;
  onChange: (tab: CarTabKey) => void;
};

export function CarTabs({ activeTab, onChange }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const tabs: { key: CarTabKey; label: string }[] = [
    { key: "overview", label: t("cars.overview") },
    { key: "services", label: t("cars.services") },
    { key: "fuel", label: t("cars.fuel") },
    { key: "expenses", label: t("cars.expenses") },
    { key: "documents", label: t("cars.documents") },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.tabs, { borderBottomColor: theme.border }]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && {
              borderBottomColor: theme.primary,
            },
          ]}
          onPress={() => onChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === tab.key ? theme.primary : theme.mutedText,
              },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderBottomWidth: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontWeight: "800",
    fontSize: 13,
  },
});