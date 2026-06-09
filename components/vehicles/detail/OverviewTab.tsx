import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { CarDetail } from "../../../types/car";
import { StatCard } from "./StatCard";
import { InfoCard } from "./InfoCard";

type Props = {
  car: CarDetail;
};

export function OverviewTab({ car }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <View style={styles.grid}>
      <StatCard
        title={t("cars.thisMonthExpenses")}
        value={car.monthlyExpenses}
        sub={`↑ ${car.monthlyChangePercent}% ${t("cars.vsLastMonth")}`}
        icon="trending-up-outline"
        accent="#16A34A"
      />

      <StatCard
        title={t("cars.totalExpenses")}
        value={car.totalExpenses}
        sub={t("cars.allTime")}
        icon="stats-chart-outline"
        accent={theme.primary}
      />

      <InfoCard
        icon="construct-outline"
        title={t("cars.lastService")}
        line1={car.lastService?.date || "-"}
        line2={car.lastService?.title || "-"}
      />

      <InfoCard
        icon="document-text-outline"
        title={t("cars.averageFuelConsumption")}
        line1={car.averageFuelConsumption || "-"}
        line2=""
      />

      <InfoCard
        icon="water-outline"
        title={t("cars.lastFuel")}
        line1={car.lastFuel?.date || "-"}
        line2={
          car.lastFuel ? `${car.lastFuel.amount} / ${car.lastFuel.cost}` : "-"
        }
      />

      <InfoCard
        icon="speedometer-outline"
        title={t("cars.costPerKm")}
        line1={car.costPerKm || "-"}
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