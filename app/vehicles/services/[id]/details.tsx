import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";

const { width } = Dimensions.get("window");

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
};

type ServiceDetails = {
  id: string;
  title?: string;
  description?: string;
  category: string;
  amount?: number;
  km: number;
  serviceDate: string;
  createdAt: string;

  car: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    imageUrl?: string;
  };

  attachments: Attachment[];
};

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [service, setService] = useState<ServiceDetails | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchService = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/services/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setService(data);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : "Failed"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchService();
  }, []);

  const openAttachment = async (file: Attachment) => {
    try {
      const url = `${API_URL}${file.fileUrl}`;

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert(
        t("common.error"),
        t("services.fileOpenFailed")
      );
    }
  };

  const isImage = (file: Attachment) => {
    return (
      file.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp)$/i.test(file.fileName)
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />

        <Text
          style={{
            color: theme.mutedText,
            marginTop: 12,
          }}
        >
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Text
          style={{
            color: theme.text,
          }}
        >
          {t("services.notFound")}
        </Text>
      </SafeAreaView>
    );
  }

  const serviceDate = new Date(
    service.serviceDate
  ).toLocaleDateString();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("services.details")}
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* ICON */}

        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                theme.activeMode === "dark"
                  ? "#172554"
                  : "#EEF4FF",
            },
          ]}
        >
          <Ionicons
            name="construct-outline"
            size={52}
            color={theme.primary}
          />
        </View>

        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          {service.title ||
            t(
              `serviceCategories.${service.category}`
            )}
        </Text>

        {/* VEHICLE CARD */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("services.vehicle")}
          </Text>

          <View style={styles.vehicleRow}>
            {service.car.imageUrl ? (
              <Image
                source={{
                  uri: `${API_URL}/../uploads/cars/${service.car.imageUrl}`,
                }}
                style={styles.vehicleImage}
              />
            ) : (
              <View
                style={[
                  styles.vehiclePlaceholder,
                  {
                    backgroundColor:
                      theme.background,
                  },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={28}
                  color={theme.mutedText}
                />
              </View>
            )}

            <View>
              <Text
                style={[
                  styles.vehicleTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {service.car.brand}{" "}
                {service.car.model}
              </Text>

              <Text
                style={{
                  color: theme.mutedText,
                }}
              >
                {service.car.plate}
              </Text>
            </View>
          </View>
        </View>

        {/* SERVICE DETAILS */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <InfoRow
            label={t("services.type")}
            value={t(
              `serviceCategories.${service.category}`
            )}
            theme={theme}
          />

          <InfoRow
            label={t("services.date")}
            value={serviceDate}
            theme={theme}
          />

          <InfoRow
            label={t("services.mileageKm")}
            value={`${service.km.toLocaleString()} km`}
            theme={theme}
          />

          <InfoRow
            label={t("services.cost")}
            value={
              service.amount
                ? `€${service.amount}`
                : "-"
            }
            theme={theme}
          />
        </View>

        {!!service.description && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              {t("services.description")}
            </Text>

            <Text
              style={{
                color: theme.mutedText,
                lineHeight: 22,
              }}
            >
              {service.description}
            </Text>
          </View>
        )}

        {/* ATTACHMENTS */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("services.files")}
          </Text>

          {service.attachments.length === 0 ? (
            <Text
              style={{
                color: theme.mutedText,
              }}
            >
              {t("services.noFiles")}
            </Text>
          ) : (
            service.attachments.map(file => {
              const url =
                `${API_URL}/uploads/services/${file.fileName}`;

              if (isImage(file)) {
                return (
                  <TouchableOpacity
                    key={file.id}
                    onPress={() =>
                      setPreviewImage(url)
                    }
                    style={styles.imageWrapper}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.attachmentImage}
                    />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={file.id}
                  onPress={() =>
                    openAttachment(file)
                  }
                  style={[
                    styles.fileRow,
                    {
                      borderColor:
                        theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={theme.primary}
                  />

                  <Text
                    style={{
                      flex: 1,
                      color: theme.text,
                    }}
                    numberOfLines={1}
                  >
                    {file.fileName}
                  </Text>

                  <Ionicons
                    name="open-outline"
                    size={20}
                    color={theme.mutedText}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* IMAGE PREVIEW */}

      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() =>
            setPreviewImage(null)
          }
        >
          <Image
            source={{
              uri: previewImage || "",
            }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  theme,
}: any) {
  return (
    <View style={styles.infoRow}>
      <Text
        style={{
          color: theme.mutedText,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: theme.text,
          fontWeight: "700",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 24,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 14,
  },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  vehicleImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },

  vehiclePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  vehicleTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  attachmentImage: {
    width: width - 84,
    height: 200,
    borderRadius: 14,
  },

  imageWrapper: {
    marginBottom: 12,
  },

  fileRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "95%",
    height: "80%",
  },
});