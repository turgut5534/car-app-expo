import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import tr from "./locales/tr.json";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

export const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem("systemLanguage");

  const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

  const language =
    savedLanguage ||
    (["tr", "en", "pl"].includes(deviceLanguage)
      ? deviceLanguage
      : "en");

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    lng: language,
    fallbackLng: "en",
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      pl: { translation: pl },
    },
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
};

export default i18n;