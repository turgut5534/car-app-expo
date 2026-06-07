import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingScreen() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { t } = useTranslation();
  const { width } = Dimensions.get("window");

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");

      if (hasSeenOnboarding === "true") {
        router.replace("/(auth)/login");
      } else {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const pages = [
    {
      title: t("onboarding.page1Title"),
      desc: t("onboarding.page1Desc"),
    },
    {
      title: t("onboarding.page2Title"),
      desc: t("onboarding.page2Desc"),
    },
    {
      title: t("onboarding.page3Title"),
      desc: t("onboarding.page3Desc"),
    },
  ];

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(auth)/login");
  };

  const nextPage = () => {
    if (page < pages.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: page + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  if (loading) {
    return null;
  }
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <TouchableOpacity
        style={styles.skip}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setPage(index);
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              paddingHorizontal: 24,
              justifyContent: "center",
            }}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>

            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 80 }}>🚗</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.dots}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, page === index && styles.activeDot]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={nextPage}>
        <Text style={styles.buttonText}>
          {page === pages.length - 1
            ? t("onboarding.start")
            : t("onboarding.next")}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  skip: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  skipText: {
    color: "#0057E7",
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#081331",
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    color: "#637083",
    lineHeight: 22,
  },
  imagePlaceholder: {
    height: 260,
    marginTop: 40,
    borderRadius: 24,
    backgroundColor: "#F4F7FD",
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#D6DCE8",
  },
  activeDot: {
    backgroundColor: "#0057E7",
    width: 20,
  },
  button: {
    backgroundColor: "#0057E7",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
