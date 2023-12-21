import React, { useContext } from "react";
import { ThemeProvider } from "styled-components";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import {
  HeaderSection,
  HeaderWrapper,
} from "../commons/EditorHeaderComponents";
import { AppsmithLink } from "../AppsmithLink";
import styles from "./styles.module.css";
import { Button, Text } from "design-system";
import clsx from "clsx";
import { CustomWidgetBuilderContext } from ".";
import {
  createMessage,
  CUSTOM_WIDGET_FEATURE,
} from "@appsmith/constants/messages";

const theme = getTheme(ThemeMode.LIGHT);

export default function Header() {
  const { close } = useContext(CustomWidgetBuilderContext);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper className={styles.headerWrapper}>
        <HeaderSection className={styles.headerSection}>
          <AppsmithLink />
          <Text className={styles.header} kind="heading-xs">
            {createMessage(CUSTOM_WIDGET_FEATURE.builder.header)}
          </Text>
        </HeaderSection>
        <HeaderSection
          className={clsx(styles.headerSection, styles.headerControls)}
        >
          <Button
            className={styles.closeButton}
            kind="tertiary"
            onClick={close}
            size="lg"
          >
            {createMessage(CUSTOM_WIDGET_FEATURE.builder.close)}
          </Button>
        </HeaderSection>
      </HeaderWrapper>
    </ThemeProvider>
  );
}
