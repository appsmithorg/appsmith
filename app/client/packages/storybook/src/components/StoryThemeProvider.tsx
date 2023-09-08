import * as React from "react";
import styled from "styled-components";
import type { UseThemeProps } from "@design-system/theming";
import { ThemeProvider, useTheme } from "@design-system/theming";

const StyledThemeProvider = styled(ThemeProvider)`
  display: inline-flex;
  min-width: 100%;
  min-height: 100%;
  padding: 36px;
  background: var(--color-bg);
  color: var(--color-fg);
  flex-direction: column;
  align-items: center;
`;

interface StoryThemeProviderProps {
  children: React.ReactNode;
  theme: UseThemeProps;
}

export const StoryThemeProvider = ({
  children,
  theme,
}: StoryThemeProviderProps) => {
  const { theme: currentTheme } = useTheme(theme);

  return (
    <StyledThemeProvider theme={currentTheme}>
      <div style={{ maxWidth: "1000px", width: "100%" }}>{children}</div>
    </StyledThemeProvider>
  );
};
