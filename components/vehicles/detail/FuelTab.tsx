import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { FuelRecord, FuelResponse } from "../../../types/car";
import { useMemo, useState } from "react";

type Props = {
  fuelResponse?: FuelResponse | null;
  carId: string;
};

export function FuelTab({ fuelResponse, carId }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  type FuelSortBy = "date" | "price" | "consumption";

  const [sortBy, setSortBy] = useState<FuelSortBy>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedFuels = useMemo(() => {
    const result = [...(fuelResponse?.fuels ?? [])];

    result.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return sortOrder === "desc"
            ? Number(b.totalAmount) - Number(a.totalAmount)
            : Number(a.totalAmount) - Number(b.totalAmount);

        case "consumption":
          return sortOrder === "desc"
            ? Number(b.consumption) - Number(a.consumption)
            : Number(a.consumption) - Number(b.consumption);

        case "date":
        default:
          return sortOrder === "desc"
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });

    return result;
  }, [fuelResponse, sortBy, sortOrder]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() =>
          router.push({
            pathname: "/vehicles/fuels/create",
            params: {
              carId,
            },
          })
        }
      >
        <Ionicons name="water" size={22} color="#fff" />
        <Text style={styles.addButtonText}>{t("cars.addFuel")}</Text>
      </TouchableOpacity>

      <View style={styles.filtersRow}>
        <View style={styles.sortContainer}>
          {/* DATE */}
          <TouchableOpacity
            style={[
              styles.sortChip,
              {
                backgroundColor: sortBy === "date" ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              if (sortBy === "date") {
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
              } else {
                setSortBy("date");
              }
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={sortBy === "date" ? "#fff" : theme.text}
            />
            <Text
              style={{
                color: sortBy === "date" ? "#fff" : theme.text,
              }}
            >
              Date
            </Text>

            {sortBy === "date" && (
              <Ionicons
                name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          {/* PRICE */}
          <TouchableOpacity
            style={[
              styles.sortChip,
              {
                backgroundColor:
                  sortBy === "price" ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              if (sortBy === "price") {
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
              } else {
                setSortBy("price");
              }
            }}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={sortBy === "price" ? "#fff" : theme.text}
            />
            <Text
              style={{
                color: sortBy === "price" ? "#fff" : theme.text,
              }}
            >
              Price
            </Text>

            {sortBy === "price" && (
              <Ionicons
                name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          {/* PRICE PER LITER */}
          <TouchableOpacity
            style={[
              styles.sortChip,
              {
                backgroundColor:
                  sortBy === "consumption" ? theme.primary : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              if (sortBy === "consumption") {
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
              } else {
                setSortBy("consumption");
              }
            }}
          >
            <Ionicons
              name="speedometer-outline"
              size={16}
              color={sortBy === "consumption" ? "#fff" : theme.text}
            />
            <Text
              style={{
                color: sortBy === "consumption" ? "#fff" : theme.text,
              }}
            >
              Consumption
            </Text>

            {sortBy === "consumption" && (
              <Ionicons
                name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

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
          <View
            style={[
              styles.statIconBox,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons name="trending-up-outline" size={22} color="#16A34A" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>
              {t("cars.averageConsumption")}
            </Text>

            <Text style={styles.greenValue}>
              {fuelResponse?.averageFuelConsumption != null
                ? Number(fuelResponse.averageFuelConsumption).toFixed(1)
                : "-"}{" "}
              L / 100 km
            </Text>
          </View>
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
          <View
            style={[
              styles.statIconBox,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#1E293B" : "#F1F5F9",
              },
            ]}
          >
            <Ionicons name="cash-outline" size={22} color={theme.text} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>
              {t("cars.averageFuelPrice")}
            </Text>

            <Text style={[styles.blackValue, { color: theme.text }]}>
              {fuelResponse?.averageFuelConsumption != null
                ? Number(fuelResponse.averageFuelPrice).toFixed(2)
                : "-"}{" "}
              {fuelResponse?.fuels[0]?.currency}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.mutedText }]}>
        {t("cars.fuelHistory")}
      </Text>

      {sortedFuels.length > 0 ? (
        <View style={styles.fuelHistoryList}>
          {sortedFuels.map((fuel) => (
            <FuelItem
              key={fuel.id}
              fuel={fuel}
              currency={fuel.currency}
              consumption={t("cars.staticConsumptionExample")}
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
          <Ionicons name="water-outline" size={42} color={theme.mutedText} />

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
  consumption,
}: {
  fuel: FuelRecord;
  currency: string;
  consumption: string;
}) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const activeCurrency = currency;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.fuelCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.fuelCardTop}>
        <View style={styles.fuelTopLeft}>
          <View
            style={[
              styles.fuelIconBox,
              {
                backgroundColor:
                  theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons name="water" size={20} color="#16A34A" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.fuelDate, { color: theme.text }]}>
              {formatFuelDate(fuel.fuelDate)}
            </Text>

            <Text style={[styles.fuelKm, { color: theme.mutedText }]}>
              {fuel.km ? `${fuel.km.toLocaleString()} km` : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.fuelTotalBox}>
          <Text style={[styles.fuelTotalLabel, { color: theme.mutedText }]}>
            {t("cars.total")}
          </Text>

          <Text style={[styles.fuelTotal, { color: theme.text }]}>
            {fuel.totalAmount} {activeCurrency}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.mutedText} />
      </View>

      <View style={[styles.fuelDivider, { backgroundColor: theme.border }]} />

      <View style={styles.fuelCardBottom}>
        <View style={styles.fuelMetric}>
          <Text style={[styles.fuelMetricValue, { color: theme.text }]}>
            {fuel.liters ?? "-"} L
          </Text>

          <Text style={[styles.fuelMetricLabel, { color: theme.mutedText }]}>
            {t("cars.litersPurchased")}
          </Text>
        </View>

        <View
          style={[styles.verticalDivider, { backgroundColor: theme.border }]}
        />

        <View style={styles.fuelMetric}>
          <Text style={[styles.fuelMetricValue, { color: theme.text }]}>
            {fuel.pricePerLiter ?? "-"} {activeCurrency}
          </Text>

          <Text style={[styles.fuelMetricLabel, { color: theme.mutedText }]}>
            {t("cars.pricePerLiter")}
          </Text>
        </View>

        <View
          style={[styles.verticalDivider, { backgroundColor: theme.border }]}
        />

        <View
          style={[
            styles.consumptionBadge,
            {
              backgroundColor:
                theme.activeMode === "dark" ? "#064E3B" : "#DCFCE7",
            },
          ]}
        >
          <Text
            style={[
              styles.consumptionLabel,
              {
                color: theme.activeMode === "dark" ? "#BBF7D0" : "#166534",
              },
            ]}
          >
            {t("cars.consumption")}
          </Text>

          <Text style={styles.consumptionValue}>
            {fuel.consumption} / 100 km
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },

  greenValue: {
    color: "#16A34A",
    fontSize: 15,
    fontWeight: "900",
  },

  blackValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  fuelHistoryList: {
    gap: 10,
  },

  fuelCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  fuelCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  fuelTopLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  fuelIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  fuelDate: {
    fontSize: 15,
    fontWeight: "900",
  },

  fuelKm: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },

  fuelTotalBox: {
    alignItems: "flex-end",
    marginRight: 6,
  },

  fuelTotalLabel: {
    fontSize: 11,
    fontWeight: "700",
  },

  fuelTotal: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "900",
  },

  fuelDivider: {
    height: 1,
    marginVertical: 10,
  },

  fuelCardBottom: {
    flexDirection: "row",
    alignItems: "center",
  },

  fuelMetric: {
    flex: 1,
    alignItems: "center",
  },

  fuelMetricValue: {
    fontSize: 13,
    fontWeight: "900",
  },

  fuelMetricLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  verticalDivider: {
    width: 1,
    height: 34,
    marginHorizontal: 6,
  },

  consumptionBadge: {
    minWidth: 104,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "center",
  },

  consumptionLabel: {
    fontSize: 10,
    fontWeight: "800",
  },

  consumptionValue: {
    marginTop: 2,
    color: "#16A34A",
    fontSize: 13,
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
  sortContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filtersRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
