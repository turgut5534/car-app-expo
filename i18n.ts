import i18n from "i18next";
import { initReactI18next, Translation } from "react-i18next";
import { getLocales } from "expo-localization";

import tr from "./locales/tr.json";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";
// const deviceLanguage = "pl"

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    lng: deviceLanguage,
    fallbackLng: "en",
    resources: {
      tr: {
        translation: tr,
      },
      en: {
        translation: en,
      },
      pl: {
        translation: pl
      }
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;