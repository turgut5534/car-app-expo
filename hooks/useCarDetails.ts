import { useCallback, useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { API_URL } from "../constants/api";
import {
  CarDetail,
  CarTabKey,
  DocumentRecord,
  FuelResponse,
  Service,
  OverviewData,
  ExpenseRecord,
} from "../types/car";

export function useCarDetail(id?: string) {
  const { t } = useTranslation();

  const [car, setCar] = useState<CarDetail | null>(null);
  const [overview, setOverview] = useState<OverviewData[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [fuels, setFuels] = useState<FuelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CarTabKey>("overview");
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRecord | null>(null);

  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [fuelsLoading, setFuelsLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);
  const [loadingMoreExpenses, setLoadingMoreExpenses] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getToken = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      router.replace("/(auth)/login");
      return null;
    }

    return token;
  }, []);

  const fetchOverView = useCallback(async () => {
    if (!id) return;

    try {
      setOverviewLoading(true);

      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/cars/overview/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Overview data could not be loaded");
      }

      setOverview(data);

      setLoadedTabs((prev) => ({
        ...prev,
        services: true,
      }));
    } finally {
      setOverviewLoading(false);
    }
  }, [id, getToken]);

  const fetchServices = useCallback(
    async (pageNumber = 1, append = false) => {
      if (!id) return;

      try {
        if (pageNumber === 1) {
          setServicesLoading(true);
        } else {
          setLoadingMore(true);
        }

        const token = await getToken();
        if (!token) return;

        const response = await fetch(
          `${API_URL}/services?carId=${id}&page=${pageNumber}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Services could not be loaded");
        }

        setServices((prev) => (append ? [...prev, ...data.items] : data.items));

        setPage(pageNumber);
        setHasMore(data.hasMore);
        setLoadingMore(false);

        setLoadedTabs((prev) => ({
          ...prev,
          services: true,
        }));
      } finally {
        setServicesLoading(false);
      }
    },
    [id, getToken],
  );

  const onRefresh = useCallback(() => {
    fetchOverView();
  }, [id]);

  const fetchDocuments = useCallback(async () => {
    if (!id) return;

    try {
      setDocumentsLoading(true);

      const token = await getToken();

      if (!token) return;

      const response = await fetch(`${API_URL}/documents?carId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Documents could not be loaded");
      }

      setDocuments(data);

      setLoadedTabs((prev) => ({
        ...prev,
        documents: true,
      }));
    } finally {
      setDocumentsLoading(false);
    }
  }, [id, getToken]);

  const fetchFuels = useCallback(async () => {
    if (!id) return;

    try {
      setFuelsLoading(true);

      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/fuels?carId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Fuels could not be loaded");
      }

      setFuels(data);

      setLoadedTabs((prev) => ({
        ...prev,
        fuel: true,
      }));
    } finally {
      setFuelsLoading(false);
    }
  }, [id, getToken]);

  const fetchExpenses = useCallback(
    async (pageNumber = 1, append = false) => {
      if (!id) return;

      try {
        if (pageNumber === 1) {
          setExpensesLoading(true);
        } else {
          setLoadingMoreExpenses(true);
        }

        const token = await getToken();
        if (!token) return;

        const response = await fetch(
          `${API_URL}/expenses?carId=${id}&page=${pageNumber}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Expenses could not be loaded");
        }

        setExpenses((prev) => (append ? [...prev, ...data.items] : data.items));

        setPage(pageNumber);
        setHasMoreExpenses(data.hasMore);
        setLoadingMoreExpenses(false);

        setLoadedTabs((prev) => ({
          ...prev,
          services: true,
        }));
      } finally {
        setExpensesLoading(false);
      }
    },
    [id, getToken],
  );

  const changeTabAndLoadLazy = useCallback(
    async (tab: CarTabKey) => {
      setActiveTab(tab);

      if (tab === "overview" && !loadedTabs.services) {
        await fetchOverView();
      }

      if (tab === "services" && !loadedTabs.services) {
        await fetchServices();
      }

      if (tab === "documents" && !loadedTabs.documents) {
        await fetchDocuments();
      }

      if (tab === "fuel" && !loadedTabs.fuel) {
        await fetchFuels();
      }

      if (tab === "expenses" && !loadedTabs.expenses) {
        await fetchExpenses();
      }
    },
    [
      loadedTabs.services,
      loadedTabs.documents,
      loadedTabs.fuel,
      loadedTabs.expenses,
      fetchOverView,
      fetchServices,
      fetchDocuments,
      fetchFuels,
      fetchExpenses,
    ],
  );
  const fetchCar = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/cars/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data?.message || t("cars.detailLoadFailed"));
      }

      setCar((prev) => ({
        ...data,
        averageFuelConsumption: data.averageFuelConsumption,
        averageFuelPrice: data.averageFuelPrice,
      }));
    } catch {
      setCar(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    fetchServices(page + 1, true);
  };

  const loadMoreExpenses = () => {
    if (loadingMoreExpenses || !hasMoreExpenses) return;

    fetchExpenses(page + 1, true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCar();
      fetchOverView();
      fetchDocuments();
      fetchExpenses();
      fetchServices(1, false);
    }, [fetchCar]),
  );
  return {
    car,
    services,
    documents,
    overview,
    fuels,
    loading,
    activeTab,
    setActiveTab,
    changeTabAndLoadLazy,
    documentsLoading,
    servicesLoading,
    selectedDocument,
    setSelectedDocument,
    refetch: fetchCar,
    fuelsLoading,
    expensesLoading,
    overviewLoading,
    loadMore,
    loadMoreExpenses,
    loadingMoreExpenses,
    expenses,
    loadingMore,
    hasMore,
    hasMoreExpenses,
    refreshing,
  };
}
