import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { OverviewData } from "../../../types/car";
import { StatCard } from "./StatCard";
import { InfoCard } from "./InfoCard";

type Props = {
  overview: OverviewData;
};

export function OverviewTab({ overview }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <View style={styles.grid}>
      <StatCard
        title={t("cars.thisMonthExpenses")}
        value={
          overview.montlyExpenses
            ? overview.montlyExpenses.toLocaleString()
            : ""
        }
        sub={`↑ ${overview.montlyExpenses ? overview.montlyExpenses.toLocaleString() : ""}% ${t("cars.vsLastMonth")}`}
        icon="trending-up-outline"
        accent="#16A34A"
      />

      <StatCard
        title={t("cars.totalExpenses")}
        value={overview.totalExpenses.toLocaleString()}
        sub={t("cars.allTime")}
        icon="stats-chart-outline"
        accent={theme.primary}
      />

      <InfoCard
        icon="construct-outline"
        title={t("cars.lastService")}
        line1={
          overview.lastService?.serviceDate
            ? new Date(overview.lastService.serviceDate)
                .toLocaleDateString("en-GB")
                .replace(/\//g, ".")
            : "-"
        }
        line2={overview.lastService?.title || "-"}
      />

      <InfoCard
        icon="document-text-outline"
        title={t("cars.averageFuelConsumption")}
        line1={overview.averageFuelConsumption.toLocaleString() || "-"}
        line2=""
      />

      <InfoCard
        icon="water-outline"
        title={t("cars.lastFuel")}
        line1={
          overview.lastFuel?.fuelDate
            ? new Date(overview.lastFuel.fuelDate).toLocaleDateString("tr-TR")
            : "-"
        }
        line2={
          overview.lastFuel
            ? `${overview.lastFuel.liters} / ${overview.lastFuel.totalAmount}`
            : "-"
        }
      />

      <InfoCard
        icon="speedometer-outline"
        title={t("cars.costPerKm")}
        line1={overview.costPerKilometer.toLocaleString() || "-"}
        line2=""
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
