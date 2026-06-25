import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/context/ThemeContext";
import { API_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FamilyMembersScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string | null>(null);

  // Search & Instant Lookup States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);

  // Fetch initial family members
  useEffect(() => {
    const fetchFamily = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          router.replace("/(auth)/login");
          return;
        }

        const response = await fetch(`${API_URL}/family/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
          setMembers([]);
          return;
        }

        const data = await response.json();

        if (!response.ok)
          throw new Error(data.message || t("profile.loadFailed"));

        setFamilyId(data.family.id);
        setMembers(Array.isArray(data.members) ? data.members : []);
        setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
      } catch (err) {
        console.log("Failed to load family:", err);
        Alert.alert(
          t("common.error", "Error"),
          t("family.loadError", "Failed to load family data"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFamily();
  }, []);

  // INSTANT SEARCH EFFECT: Triggers automatically when a valid email syntax is typed
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = searchQuery.trim();

    if (!emailRegex.test(cleanEmail)) {
      setFoundUser(null);
      return;
    }

    const lookupUserByEmail = async () => {
      try {
        setIsSearchingBackend(true);
        const token = await AsyncStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/users/lookup?email=${encodeURIComponent(cleanEmail)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (response.ok && data) {
          setFoundUser(data);
        } else {
          setFoundUser(null);
        }
      } catch (err) {
        console.log("Instant search failed:", err);
        setFoundUser(null);
      } finally {
        setIsSearchingBackend(false);
      }
    };

    lookupUserByEmail();
  }, [searchQuery]);

  // Handle sending the invite
  const handleSendInvite = async () => {
    if (!foundUser) return;

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/family/${familyId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: foundUser.email }),
      });

      if (!response.ok) {
        const error = await response.json();

        Alert.alert(t("common.error", "Error"), error.message);

        return;
      }

      Alert.alert(
        t("common.success", "Success"),
        `${t("family.inviteSent", "Invitation sent to")} ${foundUser.email}`,
      );

      // Optimistically add to pending list or refetch
      setMembers((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          name: foundUser.name || foundUser.email.split("@")[0],
          email: foundUser.email,
          avatar: foundUser.avatar,
          accessLevel: "VIEW_ONLY",
          status: "PENDING",
        },
      ]);

      setSearchQuery("");
      setFoundUser(null);
    } catch (err: any) {
      console.log(err);

      Alert.alert(
        t("common.error", "Error"),
        err.message || "Failed to send invite",
      );
    } finally {
      setSearchQuery("");
      setFoundUser(null);
    }
  };

  const handleManageMember = (member: (typeof members)[0]) => {
    Alert.alert(
      `${t("family.manage", "Manage")} ${member.name}`,
      t("family.manageDesc", "What would you like to do with this member?"),
      [
        {
          text: t("family.changeAccess", "Change Access Level"),
          onPress: () => console.log("Change access"),
        },
        {
          text: t("common.delete", "Remove Member"),
          style: "destructive",
          onPress: () =>
            setMembers((prev) => prev.filter((m) => m.id !== member.id)),
        },
        { text: t("common.cancel", "Cancel"), style: "cancel" },
      ],
    );
  };

  const shadowStyle = {
    shadowColor: theme.activeMode === "dark" ? "#000" : "#888",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.activeMode === "dark" ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 4,
  };

  // Filter groups
  const pendingInvitations = invitations.filter((m) => m.status === "PENDING");
  const activeMembers = members.filter((m) => m.status !== "PENDING");

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.mutedText, marginTop: 12 }}>
            {t("common.loading", "Loading family...")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("family.title", "Family & Sharing")}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SEARCH & INSTANT ADD SECTION */}
          <View
            style={[
              styles.searchSection,
              { backgroundColor: theme.card, borderColor: theme.border },
              shadowStyle,
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("family.addMember", "Add Family Member")}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>
              {t(
                "family.addMemberDesc",
                "Type a complete email address to instantly search for your family member.",
              )}
            </Text>

            <View
              style={[
                styles.searchRow,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.mutedText}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t(
                  "family.searchPlaceholder",
                  "Enter email address...",
                )}
                placeholderTextColor={theme.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {isSearchingBackend && (
                <ActivityIndicator
                  size="small"
                  color={theme.primary}
                  style={{ marginRight: 10 }}
                />
              )}
            </View>

            {/* INSTANT RESULT INTERFACE */}
            {foundUser && (
              <View
                style={[
                  styles.foundUserCard,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatarFallback,
                    {
                      backgroundColor: theme.primary + "20",
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    {foundUser.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.memberName,
                      { color: theme.text, fontSize: 15 },
                    ]}
                    numberOfLines={1}
                  >
                    {foundUser.name}
                  </Text>
                  <Text
                    style={{ color: theme.mutedText, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {foundUser.email}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.inviteBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSendInvite}
                >
                  <Text style={styles.inviteBtnText}>
                    {t("common.invite", "Invite")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* EMPTY STATE ALL */}
          {members.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color={theme.mutedText}
              />
              <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                {t("family.noMembers", "You do not have a family member yet.")}
              </Text>
            </View>
          )}

          {/* SECTION 1: PENDING INVITATIONS (Shown First) */}
          {pendingInvitations.length > 0 && (
            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: "#D97706" }]}>
                  {t("family.pendingInvitations", "Pending Invitations")} (
                  {pendingInvitations.length})
                </Text>
              </View>

              <View style={styles.membersList}>
                {pendingInvitations.map((invitation) => (
                  <View
                    key={invitation.id}
                    style={[
                      styles.memberCard,
                      { backgroundColor: theme.card, borderColor: "#F59E0B60" },
                      shadowStyle,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarFallback,
                        { backgroundColor: "#F59E0B20" },
                      ]}
                    >
                      <Ionicons
                        name="mail-unread-outline"
                        size={24}
                        color="#D97706"
                      />
                    </View>

                    <View style={styles.memberInfo}>
                      <Text
                        style={[styles.memberEmail, { color: theme.mutedText }]}
                        numberOfLines={1}
                      >
                        {invitation.email}
                      </Text>

                      <View style={styles.badgesRow}>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: "#F59E0B20" },
                          ]}
                        >
                          <Text
                            style={[styles.badgeText, { color: "#D97706" }]}
                          >
                            {t("family.pending", "Pending Invite")}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleManageMember(invitation)}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={22}
                        color={theme.mutedText}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* SECTION 2: ACTIVE MEMBERS */}
          {activeMembers.length > 0 && (
            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: theme.text }]}>
                  {t("family.activeMembers", "Active Members")} (
                  {activeMembers.length})
                </Text>
              </View>

              <View style={styles.membersList}>
                {activeMembers.map((member) => (
                  <View
                    key={member.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                      shadowStyle,
                    ]}
                  >
                    {member.avatar ? (
                      <Image
                        source={{ uri: member.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarFallback,
                          { backgroundColor: theme.primary + "20" },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.primary,
                            fontWeight: "800",
                            fontSize: 18,
                          }}
                        >
                          {member.name?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}

                    <View style={styles.memberInfo}>
                      <Text
                        style={[styles.memberName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {member.name}
                      </Text>
                      <Text
                        style={[styles.memberEmail, { color: theme.mutedText }]}
                        numberOfLines={1}
                      >
                        {member.email}
                      </Text>

                      <View style={styles.badgesRow}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor:
                                member.accessLevel === "FULL_ACCESS"
                                  ? theme.primary + "20"
                                  : theme.mutedText + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color:
                                  member.accessLevel === "FULL_ACCESS"
                                    ? theme.primary
                                    : theme.text,
                              },
                            ]}
                          >
                            {member.accessLevel === "FULL_ACCESS"
                              ? t("family.fullAccess", "Full Access")
                              : t("family.viewOnly", "View Only")}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleManageMember(member)}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={22}
                        color={theme.mutedText}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  scrollContent: { paddingBottom: 40 },
  searchSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    height: 56,
    paddingLeft: 16,
    width: "100%",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: "100%" },
  foundUserCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  inviteBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  listSection: { marginBottom: 24 },
  listHeader: { paddingHorizontal: 24, marginBottom: 12 },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  membersList: { paddingHorizontal: 20, gap: 12 },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: { flex: 1, marginLeft: 16, justifyContent: "center" },
  memberName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  memberEmail: { fontSize: 13, marginBottom: 8 },
  badgesRow: { flexDirection: "row", alignItems: "center" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
});
