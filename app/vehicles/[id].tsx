import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../context/ThemeContext";
import { useCarDetail } from "../../hooks/useCarDetails";

import { CarHeader } from "../../components/vehicles/detail/CarHeader";
import { CarHero } from "../../components/vehicles/detail/CarHero";
import { CarTabs } from "../../components/vehicles/detail/CarTabs";
import { OverviewTab } from "../../components/vehicles/detail/OverviewTab";
import { ServicesTab } from "../../components/vehicles/detail/ServicesTab";
import { FuelTab } from "../../components/vehicles/detail/FuelTab";
import { DocumentsTab } from "../../components/vehicles/detail/DocumentsTab";
import { ComingSoonTab } from "../../components/vehicles/detail/ComingSoonTab";
import { DocumentPreviewModal } from "../../components/vehicles/detail/DocumentPreviewModal";

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const {
    car,
    loading,
    activeTab,
    setActiveTab,
    selectedDocument,
    setSelectedDocument,
  } = useCarDetail(id);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>{t("cars.detailLoadFailed")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ backgroundColor: theme.background }}
      >
        <CarHeader car={car} />

        <CarHero car={car} />

        <CarTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? <OverviewTab car={car} /> : null}

        {activeTab === "services" ? <ServicesTab car={car} /> : null}

        {activeTab === "fuel" ? <FuelTab car={car} /> : null}

        {activeTab === "documents" ? (
          <DocumentsTab car={car} onSelectDocument={setSelectedDocument} />
        ) : null}

        {activeTab !== "overview" &&
        activeTab !== "services" &&
        activeTab !== "fuel" &&
        activeTab !== "documents" ? (
          <ComingSoonTab />
        ) : null}
      </ScrollView>

      <DocumentPreviewModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
