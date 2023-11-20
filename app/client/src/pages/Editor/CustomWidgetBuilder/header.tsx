import React, { useContext } from "react";
import { ThemeProvider } from "styled-components";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import {
  HeaderSection,
  HeaderWrapper,
} from "../commons/EditorHeaderComponents";
import { AppsmithLink } from "../AppsmithLink";
import { EditorSaveIndicator } from "../EditorSaveIndicator";
import styles from "./styles.module.css";
import { Button } from "design-system";
import clsx from "clsx";
import { CustomWidgetBuilderContext } from ".";

const theme = getTheme(ThemeMode.LIGHT);

export default function Header() {
  const { discard, save, saving } = useContext(CustomWidgetBuilderContext);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper className={styles.headerWrapper}>
        <HeaderSection className={styles.headerSection}>
          <AppsmithLink />

          <EditorSaveIndicator isSaving={!!saving} saveError={false} />
        </HeaderSection>
        <HeaderSection
          className={clsx(styles.headerSection, styles.headerControls)}
        >
          <Button kind="tertiary" onClick={discard} size="lg">
            Discard
          </Button>
          <Button kind="primary" onClick={save} size="lg">
            Save
          </Button>
        </HeaderSection>
      </HeaderWrapper>
    </ThemeProvider>
  );
}
