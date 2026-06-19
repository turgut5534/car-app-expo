import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {  MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../../context/ThemeContext";
import { OverviewData } from "../../../types/car";

type Props = {
  overview?: OverviewData[];
  refreshing: boolean;
};

export function OverviewTab({ overview, refreshing }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const getEventStyle = (item: OverviewData) => {
    switch (item.type) {
      case "FUEL":
        return {
          icon: "gas-station",
          color: "#3B82F6",
          bg: "rgba(59, 130, 246, 0.12)",
        };
      case "EXPENSE":
        return {
          icon: "cash",
          color: "#F97316",
          bg: "rgba(249, 115, 22, 0.12)",
        };
      case "DOCUMENT":
        return {
          icon: "file-document-outline",
          color: "#6B7280",
          bg: "rgba(107, 114, 128, 0.12)",
        };
      case "SERVICE":
      default:
        // Dynamic look if it's an oil change service item
        const isOil = item.title?.toLowerCase().includes("oil");
        return {
          icon: isOil ? "oil" : "wrench",
          color: isOil ? "#16A34A" : "#8B5CF6",
          bg: isOil ? "rgba(22, 163, 74, 0.12)" : "rgba(139, 92, 246, 0.12)",
        };
    }
  };

  const renderHistoryItem = ({
    item,
    index,
  }: {
    item: OverviewData;
    index: number;
  }) => {
    const isLast = overview ? index === overview.length - 1 : false;
    const styleData = getEventStyle(item);

    const fullDescription = item.description
      ? `${item.description} • ${item.amount?.toLocaleString()} ${item.currency}`
      : `${item.amount} ${item.currency}`;

    return (
      <TouchableOpacity
        key={item.id ? `${item.type}-${item.id}` : index.toString()}
        activeOpacity={0.7}
        style={styles.historyItem}
      >
        {/* Left Column Layout: Connector line and graphic indicator icons */}
        <View style={styles.timelineCol}>
          {!isLast && (
            <View
              style={[styles.timelineLine, { backgroundColor: theme.border }]}
            />
          )}

          <View
            style={[styles.iconCircle, { backgroundColor: styleData.color }]}
          >
            <MaterialCommunityIcons
              name={styleData.icon as any}
              size={20}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Right Content Data Display Field columns split */}
        <View
          style={[
            styles.contentCol,
            !isLast && { borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.contentHeader}>
            <Text
              style={[styles.itemTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.type === "FUEL"
                ? t("cars.refuel", "Tanked Up")
                : item.title}
            </Text>
            <Text style={[styles.itemDate, { color: theme.mutedText }]}>
              {item.date
                ? new Date(item.date).toLocaleDateString("tr-TR")
                : "-"}
            </Text>
          </View>

          <Text
            style={[styles.itemDescription, { color: theme.mutedText }]}
            numberOfLines={1}
          >
            {fullDescription}
          </Text>

          <View style={styles.contentFooter}>
            {item.mileage != null ? (
              <View
                style={[styles.mileagePill, { backgroundColor: styleData.bg }]}
              >
                <Text style={[styles.mileageText, { color: styleData.color }]}>
                  {item.mileage.toLocaleString()} km
                </Text>
              </View>
            ) : (
              <View style={{ height: 24 }} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {overview && overview.length > 0 ? (
          overview.map((item, index) => renderHistoryItem({ item, index }))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-clock-outline"
              size={50}
              color={theme.border}
            />
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>
              {t("cars.noHistoryRecords", "No history records found.")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  listContent: { paddingBottom: 32 },
  listHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  carCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  carImage: { width: 85, height: 55, borderRadius: 8 },
  carImagePlaceholder: {
    width: 85,
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  carDetails: { flex: 1, marginLeft: 16, justifyContent: "center" },
  carTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  carSubtitle: { fontSize: 12, marginBottom: 6 },
  plateContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#FACC15",
    borderRadius: 4,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAB308",
  },
  plateCountryCode: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 3,
    paddingVertical: 1,
    justifyContent: "center",
  },
  plateCountryText: { color: "#FFF", fontSize: 9, fontWeight: "900" },
  plateText: {
    paddingHorizontal: 6,
    fontWeight: "700",
    color: "#000",
    fontSize: 11,
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyItem: { flexDirection: "row", paddingHorizontal: 16 },
  timelineCol: { alignItems: "center", width: 36, marginRight: 12 },
  timelineLine: { position: "absolute", top: 40, bottom: -16, width: 2 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    zIndex: 2,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  itemTitle: { fontSize: 15, fontWeight: "700", flex: 1, paddingRight: 8 },
  itemDate: { fontSize: 12 },
  itemDescription: { fontSize: 13, marginBottom: 8 },
  contentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mileagePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mileageText: { fontSize: 11, fontWeight: "700" },
  emptyContainer: { paddingTop: 48, alignItems: "center" },
  emptyText: { marginTop: 10, fontSize: 14 },
});
