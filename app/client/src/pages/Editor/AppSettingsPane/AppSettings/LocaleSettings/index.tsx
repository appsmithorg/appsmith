import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Input, Button, Text } from "design-system";
import english from "locale/en.json";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "./localStorage/localStorageHelper";
import {
  LS_CURRENT_LOCALE_NAME,
  LS_LOCALE_OBJECT,
} from "./localStorage/constants";

const defaultLocaleName = "en";

const SyledContainer = styled.section`
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const LocaleInputWrapper = styled.div`
  position: relative;
`;
const StyledTextArea = styled.textarea`
  border: 1px solid gray;
  box-shadow: 0 0 5px gray;
  width: 100%;
  border-radius: 5px;
  padding: 0.5rem;
`;
const ResetButton = styled(Button)`
  position: absolute !important;
  top: 10px;
  right: 20px;
`;

function LocaleSettings() {
  const { t } = useTranslation();
  const [localeInput, setLocaleInput] = useState(
    JSON.stringify(english, null, 2),
  );
  const [localeName, setLocaleName] = useState(defaultLocaleName);

  useEffect(() => {
    const currentLocale = getLocalStorageItem(LS_CURRENT_LOCALE_NAME);
    if (currentLocale) {
      const localeObj = getLocalStorageItem(LS_LOCALE_OBJECT);
      if (currentLocale in localeObj) {
        setLocaleName(currentLocale);
        setLocaleInput(JSON.stringify(localeObj[currentLocale], null, 2));
      }
    }
  }, []);

  const applyLocale = (name: string, locale: unknown) => {
    i18n.addResourceBundle(localeName, "translation", locale);
    i18n.changeLanguage(name);
  };

  function addToLocalStorage(name: string, locale: unknown) {
    setLocalStorageItem(LS_CURRENT_LOCALE_NAME, name);

    const localeObj = getLocalStorageItem(LS_LOCALE_OBJECT);
    if (localeObj) {
      localeObj[name] = locale;
      setLocalStorageItem(LS_LOCALE_OBJECT, localeObj);
    } else {
      setLocalStorageItem(LS_LOCALE_OBJECT, { [name]: locale });
    }
  }

  const handleLocaleChange = () => {
    const locale: unknown = JSON.parse(localeInput);

    addToLocalStorage(localeName, locale);
    applyLocale(localeName, locale);
  };

  const resetLocale = () => {
    setLocaleInput(JSON.stringify(english, null, 2));
    setLocaleName(defaultLocaleName);
  };
  return (
    <SyledContainer>
      <Text>{t("app_settings.locale_settings.description")}</Text>
      <LocaleInputWrapper>
        <StyledTextArea
          onChange={(e) => setLocaleInput(e.target.value)}
          rows={25}
          value={localeInput}
        />
        {localeName !== defaultLocaleName && (
          <ResetButton onClick={resetLocale}>Reset</ResetButton>
        )}
      </LocaleInputWrapper>
      <Input
        onChange={setLocaleName}
        placeholder={t("app_settings.locale_settings.locale_input_placeholder")}
        size="md"
        value={localeName}
      />
      <Button onClick={handleLocaleChange} size="md">
        {t("app_settings.locale_settings.apply_button")}
      </Button>
    </SyledContainer>
  );
}

export default LocaleSettings;
