import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/context/ThemeContext";

// Mock data for demonstration - replace with actual API fetching
const MOCK_MEMBERS = [
  {
    id: "1",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    accessLevel: "FULL_ACCESS", // FULL_ACCESS, VIEW_ONLY
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Mike Jenkins",
    email: "mike.jenkins99@example.com",
    avatar: "https://i.pravatar.cc/150?u=mike",
    accessLevel: "VIEW_ONLY",
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Anna Smith",
    email: "anna.s@example.com",
    avatar: null, // Fallback to initial/icon
    accessLevel: "VIEW_ONLY",
    status: "PENDING", // Pending invite
  },
];

export default function FamilyMembersScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchAdd = () => {
    if (!searchQuery.trim()) {
      Alert.alert(t("common.error"), t("family.enterEmailToSearch", "Please enter an email to search."));
      return;
    }
    // Implement API call to search user and send invite
    Alert.alert(
      t("family.inviteSent", "Invite Sent"),
      `${t("family.inviteSentDesc", "An invitation has been sent to")} ${searchQuery}`
    );
    setSearchQuery("");
  };

  const handleManageMember = (member: typeof MOCK_MEMBERS[0]) => {
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
          onPress: () => {
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
          },
        },
        { text: t("common.cancel", "Cancel"), style: "cancel" },
      ]
    );
  };

  const shadowStyle = {
    shadowColor: theme.activeMode === "dark" ? "#000" : "#888",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.activeMode === "dark" ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 4,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("family.title", "Family & Sharing")}
          </Text>
          <View style={{ width: 40 }} /> {/* Spacer */}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* SEARCH & ADD SECTION */}
          <View style={[styles.searchSection, { backgroundColor: theme.card, borderColor: theme.border }, shadowStyle]}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: "center", marginBottom: 6 }]}>
              {t("family.addMember", "Add Family Member")}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.mutedText, textAlign: "center", marginBottom: 20 }]}>
              {t("family.addMemberDesc", "Invite someone to view or manage your vehicles and expenses.")}
            </Text>

            <View style={[styles.searchRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="search" size={20} color={theme.mutedText} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t("family.searchPlaceholder", "Email or username...")}
                placeholderTextColor={theme.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TouchableOpacity 
                style={[styles.searchBtn, { backgroundColor: theme.primary }]}
                onPress={handleSearchAdd}
              >
                <Text style={styles.searchBtnText}>{t("common.add", "Add")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MEMBERS LIST */}
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>
              {t("family.existingMembers", "Existing Members")} ({members.length})
            </Text>
          </View>

          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.mutedText} />
              <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                {t("family.noMembers", "You haven't added any family members yet.")}
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {members.map((member) => (
                <View 
                  key={member.id} 
                  style={[styles.memberCard, { backgroundColor: theme.card, borderColor: theme.border }, shadowStyle]}
                >
                  {/* AVATAR */}
                  {member.avatar ? (
                    <Image source={{ uri: member.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: theme.primary + "20" }]}>
                      <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 18 }}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* INFO */}
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.mutedText }]} numberOfLines={1}>
                      {member.email}
                    </Text>
                    
                    {/* BADGES */}
                    <View style={styles.badgesRow}>
                      <View style={[styles.badge, { backgroundColor: member.accessLevel === "FULL_ACCESS" ? theme.primary + "20" : theme.mutedText + "20" }]}>
                        <Text style={[styles.badgeText, { color: member.accessLevel === "FULL_ACCESS" ? theme.primary : theme.text }]}>
                          {member.accessLevel === "FULL_ACCESS" ? t("family.fullAccess", "Full Access") : t("family.viewOnly", "View Only")}
                        </Text>
                      </View>

                      {member.status === "PENDING" && (
                        <View style={[styles.badge, { backgroundColor: "#F59E0B20", marginLeft: 6 }]}>
                          <Text style={[styles.badgeText, { color: "#D97706" }]}>
                            {t("family.pending", "Pending Invite")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ACTION BUTTON */}
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleManageMember(member)}
                  >
                    <Ionicons name="ellipsis-vertical" size={22} color={theme.mutedText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // SEARCH / ADD SECTION
  searchSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
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
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    height: 56,
    paddingLeft: 16,
    paddingRight: 6,
    width: "100%",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  searchBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  // LIST SECTION
  listHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  membersList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },

  // EMPTY STATE
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