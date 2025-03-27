import React from "react";
import { useState } from "react";
import {
  TokenTable,
  StyledSquarePreview,
  ThemeSettings,
} from "@design-system/storybook";
import { useTheme, ThemeProvider } from "@appsmith/wds-theming";
import { defaultTokens } from "@appsmith/wds-theming";

interface ColorTableProps {
  filter?: string | string[];
  isExactMatch?: boolean;
}

export const ColorTable = ({
  filter,
  isExactMatch = true,
}: ColorTableProps) => {
  const [seedColor, setSeedColor] = useState<string | undefined>(
    defaultTokens.seedColor,
  );
  const [isDarkMode, setDarkMode] = useState<boolean | undefined>(false);
  const { theme } = useTheme({
    seedColor,
    colorMode: Boolean(isDarkMode) ? "dark" : "light",
  });
  const { color } = theme;

  return (
    <>
      <ThemeSettings
        direction="row"
        isDarkMode={isDarkMode}
        seedColor={seedColor}
        setDarkMode={setDarkMode}
        setSeedColor={setSeedColor}
      />
      <ThemeProvider
        style={{ backgroundColor: "var(--color-bg)" }}
        theme={theme}
      >
        <TokenTable
          filter={filter}
          isExactMatch={isExactMatch}
          prefix="color"
          tokens={color}
        >
          {(cssVar) => (
            <StyledSquarePreview
              style={{
                background: cssVar,
              }}
            />
          )}
        </TokenTable>
      </ThemeProvider>
    </>
  );
};
