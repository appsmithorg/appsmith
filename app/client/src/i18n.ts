import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tableV2en from "widgets/TableWidgetV2/locale/en.json";

export const resources = {
  en: {
    translation: {
      tableV2: tableV2en,
    },
  },
} as const;

i18n.use(initReactI18next).init({
  lng: "en",
  resources,
});
