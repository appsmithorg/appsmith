import React from "react";
import { ThemeProvider, TokensAccessor } from "@design-system/theming";
import { COLORS } from "./colors";

export const TestComponent = (props: any) => {
  const { children, colorScheme } = props;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
        gap: "10px",
      }}
    >
      {Object.keys(COLORS).map((colorKey) => {
        // @ts-expect-error for some reason
        return Object.keys(COLORS[colorKey]).map((colorNestedKey) => {
          const tokensAccessor = new TokensAccessor(
            // @ts-expect-error for some reason
            COLORS[colorKey][colorNestedKey],
            colorScheme,
          );

          return (
            <ThemeProvider
              // @ts-expect-error for some reason
              key={COLORS[colorKey][colorNestedKey]}
              theme={tokensAccessor.getAllTokens()}
            >
              <div
                style={{
                  padding: "20px",
                  background: "var(--color-bg)",
                }}
              >
                {children}
              </div>
            </ThemeProvider>
          );
        });
      })}
    </div>
  );
};
