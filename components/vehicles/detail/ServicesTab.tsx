import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { Service } from "../../../types/car";
import { ServiceItem } from "./ServiceItem";

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

      <Text>Count: {services.length}</Text>

      {services.length > 0 ? (
        <>
          {services.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
              currency={service.createdBy.currency || ""}
            />
          ))}

          {hasMore && (
            <TouchableOpacity
              onPress={loadMore}
              disabled={loadingMore}
              style={[
                styles.loadMoreButton,
                { borderColor: theme.border },
              ]}
            >
              {loadingMore ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text style={{ color: theme.text }}>
                  Load More
                </Text>
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
          <Text style={{ color: theme.mutedText }}>
            {t("cars.noServices")}
          </Text>
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
});