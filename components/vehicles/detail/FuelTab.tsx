import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { CarDetail, FuelRecord } from "../../../types/car";

type Props = {
  car: CarDetail;
};

export function FuelTab({ car }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const currency = car.owner?.currency || "";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push(`/vehicles/${car.id}/fuels/create`)}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addButtonText}>{t("cars.addFuel")}</Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.statLabel, { color: theme.mutedText }]}>
            {t("cars.averageConsumption")}
          </Text>

          <Text style={styles.greenValue}>
            {car.averageFuelConsumption || "-"}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.statLabel, { color: theme.mutedText }]}>
            {t("cars.averageFuelPrice")}
          </Text>

          <Text style={[styles.blackValue, { color: theme.text }]}>
            {car.averageFuelPrice || "-"}
          </Text>
        </View>
      </View>

      {car.fuelRecords.length > 0 ? (
        <View
          style={[
            styles.listCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {car.fuelRecords.map((fuel, index) => (
            <FuelItem
              key={fuel.id}
              fuel={fuel}
              currency={currency}
              isLast={index === car.fuelRecords.length - 1}
            />
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="water-outline"
            size={42}
            color={theme.mutedText}
          />

          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t("cars.noFuelRecords")}
          </Text>

          <Text style={[styles.emptyText, { color: theme.mutedText }]}>
            {t("cars.noFuelRecordsDescription")}
          </Text>
        </View>
      )}
    </View>
  );
}

function FuelItem({
  fuel,
  currency,
  isLast,
}: {
  fuel: FuelRecord;
  currency: string;
  isLast: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.fuelItem,
        !isLast && {
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View style={styles.fuelLeft}>
        <View
          style={[
            styles.fuelIconBox,
            {
              backgroundColor:
                theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
            },
          ]}
        >
          <Ionicons name="water" size={22} color="#16A34A" />
        </View>

        <View>
          <Text style={[styles.fuelDate, { color: theme.text }]}>
            {formatFuelDate(fuel.fuelDate)}
          </Text>

          <Text style={[styles.fuelMeta, { color: theme.mutedText }]}>
            {fuel.liter} L · {fuel.pricePerLiter}
          </Text>
        </View>
      </View>

      <View style={styles.fuelKmBox}>
        <Text style={[styles.fuelKm, { color: theme.mutedText }]}>
          {fuel.km?.toLocaleString()} km
        </Text>
      </View>

      <Text style={[styles.fuelTotal, { color: theme.text }]}>
        {fuel.totalCost} {fuel.currency || currency}
      </Text>
    </View>
  );
}

function formatFuelDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  addButton: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 10,
  },

  greenValue: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "900",
  },

  blackValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
  },

  fuelItem: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },

  fuelLeft: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  fuelIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  fuelDate: {
    fontSize: 14,
    fontWeight: "900",
  },

  fuelMeta: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "700",
  },

  fuelKmBox: {
    flex: 0.9,
    alignItems: "center",
  },

  fuelKm: {
    fontSize: 13,
    fontWeight: "800",
  },

  fuelTotal: {
    flex: 0.8,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "900",
  },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});