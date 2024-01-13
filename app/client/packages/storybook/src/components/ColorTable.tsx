import React from "react";
import { useState } from "react";
import {
  TokenTable,
  StyledSquarePreview,
  ThemeSettings,
} from "@design-system/storybook";
import { useTheme, ThemeProvider } from "@design-system/theming";
import { defaultTokens } from "@design-system/theming";

interface ColorTableProps {
  filter?: string | string[];
  isExactMatch?: boolean;
}

export const ColorTable = ({
  filter,
  isExactMatch = true,
}: ColorTableProps) => {
  const [seedColor, setSeedColor] = useState(defaultTokens.seedColor);
  const [isDarkMode, setDarkMode] = useState(false);
  const { theme } = useTheme({
    seedColor,
    colorMode: isDarkMode ? "dark" : "light",
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
