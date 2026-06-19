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
import {ExpensesTab} from "@/components/vehicles/detail/ExpensesTab";

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const {
    car,
    services,
    overview,
    documents,
    fuels,
    loading,
    activeTab,
    changeTabAndLoadLazy,
    servicesLoading,
    documentsLoading,
    fuelsLoading,
    overviewLoading,
    loadingMore,
    hasMore,  
    loadMore,
    refreshing,
    expenses,
    expensesLoading,
    loadMoreExpenses,
    loadingMoreExpenses,
    hasMoreExpenses
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

        <CarTabs activeTab={activeTab} onChange={changeTabAndLoadLazy} />

        {activeTab === "overview" ? (
          overviewLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : overview ? (
            <OverviewTab overview={overview} refreshing={refreshing} />
          ) : (
            <Text>No overview data</Text>
          )
        ) : null}

        {activeTab === "services" ? (
          servicesLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <ServicesTab services={services} carId={car.id} loadMore={loadMore} loadingMore={loadingMore} hasMore={hasMore}  />
          )
        ) : null}

        {activeTab === "fuel" ? (
          fuelsLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <FuelTab fuelResponse={fuels} carId={car.id} />
          )
        ) : null}
        
        {activeTab === "expenses" ? (
          expensesLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <ExpensesTab expenses={expenses} carId={car.id} loadMoreExpenses={loadMoreExpenses} loadingMoreExpenses={loadingMoreExpenses} hasMoreExpenses={hasMoreExpenses} />
          )
        ) : null}

        {activeTab === "documents" ? (
          documentsLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <DocumentsTab documents={documents} carId={car.id} />
          )
        ) : null}

        {activeTab !== "overview" &&
        activeTab !== "services" &&
        activeTab !== "fuel" &&
        activeTab !== "expenses" &&
        activeTab !== "documents" ? (
          <ComingSoonTab />
        ) : null}
      </ScrollView>
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
