import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import english from "./locale/en.json";

export const resources = {
  en: {
    translation: english,
  },
} as const;

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources,
});
