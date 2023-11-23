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

const theme = getTheme(ThemeMode.LIGHT);

export default function Header() {
  const { discard } = useContext(CustomWidgetBuilderContext);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper className={styles.headerWrapper}>
        <HeaderSection className={styles.headerSection}>
          <AppsmithLink />
          <Text className={styles.header} kind="heading-xs">
            Custom Widget Builder
          </Text>
        </HeaderSection>
        <HeaderSection
          className={clsx(styles.headerSection, styles.headerControls)}
        >
          <Text className={styles.autosave}>
            your changes will get auto saved
          </Text>
          <Button kind="tertiary" onClick={discard} size="lg">
            Close
          </Button>
          {/* <Button kind="primary" onClick={save} size="lg">
            Save
          </Button> */}
        </HeaderSection>
      </HeaderWrapper>
    </ThemeProvider>
  );
}
