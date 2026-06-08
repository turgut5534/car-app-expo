import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        router.replace("/home");
      } else {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
