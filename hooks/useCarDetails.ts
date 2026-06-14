import { useCallback, useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { API_URL } from "../constants/api";
import { CarDetail, CarTabKey, DocumentRecord } from "../types/car";

export function useCarDetail(id?: string) {
  const { t } = useTranslation();

  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CarTabKey>("overview");
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRecord | null>(null);

  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  const [servicesLoading, setServicesLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [fuelsLoading, setFuelsLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);

  const getToken = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      router.replace("/(auth)/login");
      return null;
    }

    return token;
  }, []);

  const fetchServices = useCallback(async () => {
    if (!id) return;

    try {
      setServicesLoading(true);

      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/services?carId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Services could not be loaded");
      }

      setCar((prev) =>
        prev
          ? {
              ...prev,
              services: data,
            }
          : prev,
      );

      setLoadedTabs((prev) => ({
        ...prev,
        services: true,
      }));
    } finally {
      setServicesLoading(false);
    }
  }, [id, getToken]);

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

      setCar((prev) =>
        prev
          ? {
              ...prev,
              documents: data,
            }
          : prev,
      );

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

      setCar((prev) =>
        prev
          ? {
              ...prev,
              fuelRecords: data,
            }
          : prev,
      );

      setLoadedTabs((prev) => ({
        ...prev,
        fuel: true,
      }));
    } finally {
      setFuelsLoading(false);
    }
  }, [id, getToken]);

  const fetchExpenses = useCallback(async () => {
    if (!id) return;

    try {
      setExpensesLoading(true);

      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/expenses?carId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Expenses could not be loaded");
      }

      setCar((prev) =>
        prev
          ? {
              ...prev,
              expenses: data,
            }
          : prev,
      );

      setLoadedTabs((prev) => ({
        ...prev,
        expenses: true,
      }));
    } finally {
      setExpensesLoading(false);
    }
  }, [id, getToken]);

  const changeTabAndLoadLazy = useCallback(
    async (tab: CarTabKey) => {
      setActiveTab(tab);

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

        services: prev?.services ?? data.services ?? [],
        documents: prev?.documents ?? data.documents ?? [],
        fuelRecords: prev?.fuelRecords ?? data.fuels ?? [],
        expenses: prev?.expenses ?? data.expenses ?? [],

        averageFuelConsumption: data.averageFuelConsumption,
        averageFuelPrice: data.averageFuelPrice,
      }));
    } catch {
      setCar(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

useFocusEffect(
    useCallback(() => {
      fetchCar();
    }, [fetchCar])
  );
  return {
    car,
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
  };
}
