import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>📊</Text>

        <Text style={styles.title}>Reports</Text>

        <Text style={styles.subtitle}>
          This page is currently under development.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 56,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  badgeText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
});