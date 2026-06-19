import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { Service } from "../../../types/car";
import { ServiceItem } from "./ServiceItem";
import { useMemo, useState } from "react";

type Props = {
  services?: Service[];
  carId: string;
  loadMore: () => void;
  loadingMore: boolean;
  hasMore: boolean;
};

export function ServicesTab({
  services = [],
  carId,
  loadMore,
  loadingMore,
  hasMore,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const filteredServices = useMemo(() => {
    let result = [...services];

    if (search.trim()) {
      result = result.filter((service) =>
        service.title?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [services, search, sortOrder]);

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() =>
          router.push({
            pathname: "/vehicles/services/create",
            params: {
              carId,
            },
          })
        }
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t("cars.addService")}</Text>
      </TouchableOpacity>

      <View style={styles.filtersRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search services..."
          placeholderTextColor={theme.mutedText}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.sortButton,
            {
              borderColor: theme.border,
            },
          ]}
          onPress={() =>
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
          }
        >
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={18}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          color: theme.mutedText,
          marginBottom: 12,
        }}
      >
        {t("services.totalServices")}: {filteredServices.length}{" "}
      </Text>

      {services.length > 0 ? (
        <>
          {filteredServices.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
            />
          ))}

          {hasMore && (
            <TouchableOpacity
              onPress={loadMore}
              disabled={loadingMore}
              style={[styles.loadMoreButton, { borderColor: theme.border }]}
            >
              {loadingMore ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text style={{ color: theme.text }}>Load More</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View
          style={[
            styles.emptyTab,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={{ color: theme.mutedText }}>{t("cars.noServices")}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
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
    fontWeight: "800",
    fontSize: 15,
  },
  emptyTab: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },

  sortButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
