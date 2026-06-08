// app/vehicles/_layout.tsx

import { Stack } from "expo-router";

export default function VehiclesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}