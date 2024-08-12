import React, { useContext } from "react";
import { ThemeProvider } from "styled-components";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import {
  HeaderSection,
  HeaderWrapper,
} from "../commons/EditorHeaderComponents";
import { AppsmithLink } from "../AppsmithLink";
import styles from "./styles.module.css";
import { Button, Icon, Text } from "@appsmith/ads";
import clsx from "clsx";
import { CustomWidgetBuilderContext } from ".";
import { createMessage, CUSTOM_WIDGET_FEATURE } from "ee/constants/messages";

const theme = getTheme(ThemeMode.LIGHT);

export default function Header() {
  const { close, showConnectionLostMessage } = useContext(
    CustomWidgetBuilderContext,
  );

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
          {showConnectionLostMessage && (
            <>
              <Text color="var(--ads-old-color-pomegranate)">
                {createMessage(CUSTOM_WIDGET_FEATURE.builder.connectionLost)}
              </Text>
              <Icon
                name="link-unlink"
                size="md"
                style={{
                  color: "var(--ads-old-color-pomegranate)",
                }}
              />
            </>
          )}
          <Button
            className={styles.closeButton}
            kind="tertiary"
            onClick={close}
            // @ts-expect-error Fix this the next time the file is edited
            size="lg"
          >
            {createMessage(CUSTOM_WIDGET_FEATURE.builder.close)}
          </Button>
        </HeaderSection>
      </HeaderWrapper>
    </ThemeProvider>
  );
}
