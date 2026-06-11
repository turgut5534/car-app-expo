import { ImageBackground, View, Text, StyleSheet } from "react-native";

import { useAppTheme } from "../../../context/ThemeContext";
import { API_URL } from "../../../constants/api";
import { CarDetail } from "../../../types/car";
import { useTranslation } from "react-i18next";

type Props = {
  car: CarDetail;
};

export function CarHero({ car }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={
        car.imageUrl
          ? { uri: `${API_URL}/uploads/cars/${car.imageUrl}` }
          : require("../../../assets/images/image.png")
      }
      style={styles.hero}
      imageStyle={styles.heroImage}
    >
      <View style={styles.heroOverlay} />

      <View style={styles.heroContent}>
        <View>
          <Text style={styles.carName}>
            {car.brand} {car.model}
          </Text>
          <Text style={styles.plate}>{car.plate}</Text>
          <Text style={styles.plate}>
            {t(`vehicles.fuelTypes.${car.fuelType}`)}
          </Text>
        </View>

        <View style={styles.kmBadge}>
          <Text style={[styles.kmText, { color: theme.primary }]}>
            {car.currentKm?.toLocaleString() ?? 0} km
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 220,
    justifyContent: "flex-end",
  },
  heroImage: {
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  carName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  plate: {
    color: "#E5E7EB",
    marginTop: 4,
    fontWeight: "700",
  },
  kmBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  kmText: {
    fontWeight: "900",
  },
});
