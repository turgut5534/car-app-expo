import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "INVITE" | "EXPENSE" | "VEHICLE" | "SYSTEM";
  read: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Notifications from Backend
  const fetchNotifications = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t("notifications.loadFailed", "Failed to load notifications"));

      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Failed to fetch notifications:", err);
      Alert.alert(t("common.error", "Error"), t("notifications.fetchError", "Could not update notifications."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle Pull-to-Refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(false);
  }, []);

  // Mark Individual Notification as Read
  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.read) return; // Already read

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/${item.id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.log("Failed to mark notification as read:", err);
      // Revert if API fails
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: false } : n))
      );
    }
  };

  // Mark All Notifications as Read
  const handleMarkAllAsRead = async () => {
    if (notifications.every((n) => n.read)) return;

    const oldNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error();
    } catch (err) {
      console.log("Failed to mark all as read:", err);
      setNotifications(oldNotifications); // Revert on failure
      Alert.alert(t("common.error", "Error"), t("notifications.actionFailed", "Action failed. Please try again."));
    }
  };

  // Helper: Get Icon name and color based on notification backend type
  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "INVITE":
        return { name: "people-outline" as const, color: theme.primary };
      case "EXPENSE":
        return { name: "wallet-outline" as const, color: "#10B981" }; // Green
      case "VEHICLE":
        return { name: "car-outline" as const, color: "#F59E0B" }; // Amber
      case "SYSTEM":
      default:
        return { name: "information-circle-outline" as const, color: theme.mutedText };
    }
  };

  // Helper: Basic timestamp formatter
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const shadowStyle = {
    shadowColor: theme.activeMode === "dark" ? "#000" : "#888",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.activeMode === "dark" ? 0.2 : 0.05,
    shadowRadius: 10,
    elevation: 3,
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("notifications.title", "Notifications")}
        </Text>
        
        {/* Mark All Read Button */}
        {notifications.some((n) => !n.read) ? (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.rightButton}>
            <Ionicons name="checkmark-done" size={24} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* NOTIFICATIONS LIST / EMPTY STATE */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
              <Ionicons name="notifications-off-outline" size={40} color={theme.mutedText} />
            </View>
            <Text style={[styles.emptyTextTitle, { color: theme.text }]}>
              {t("notifications.emptyTitle", "All caught up!")}
            </Text>
            <Text style={[styles.emptyTextSub, { color: theme.mutedText }]}>
              {t("notifications.emptyDesc", "You don't have any new notifications right now.")}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const iconConfig = getNotificationIcon(item.type);
          return (
            <TouchableOpacity
              activeOpacity={item.read ? 0.7 : 0.5}
              onPress={() => handleNotificationPress(item)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: item.read ? theme.border : theme.primary + "30",
                  borderWidth: item.read ? 1 : 1.5,
                },
                shadowStyle,
              ]}
            >
              {/* Type Dynamic Icon */}
              <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + "15" }]}>
                <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
              </View>

              {/* Core Text Info */}
              <View style={styles.infoContainer}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.text, fontWeight: item.read ? "600" : "800" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {/* Unread Indicator Accent Dot */}
                  {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                </View>
                
                <Text style={[styles.cardBody, { color: item.read ? theme.mutedText : theme.text }]} numberOfLines={3}>
                  {item.body}
                </Text>
                
                <Text style={[styles.timestamp, { color: theme.mutedText }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    gap: 14,
    flexGrow: 1,
  },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyTextSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});