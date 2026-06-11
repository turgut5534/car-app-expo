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

      setCar({
        ...data,
        services: data.services ?? [],
        documents: data.documents ?? [],
        fuelRecords: data.fuels ?? [],
        averageFuelConsumption: data.averageFuelConsumption,
        averageFuelPrice: data.averageFuelPrice
      });
    } catch {
      setCar(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      fetchCar();
    }, [fetchCar]),
  );

  return {
    car,
    loading,
    activeTab,
    setActiveTab,
    selectedDocument,
    setSelectedDocument,
    refetch: fetchCar,
  };
}
