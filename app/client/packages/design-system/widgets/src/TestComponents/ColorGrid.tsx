import React from "react";
import {
  ThemeProvider,
  TokensAccessor,
  LightModeTheme,
  DarkModeTheme,
  defaultTokens,
} from "@design-system/theming";
import Color from "colorjs.io";
import { Text } from "../";
import { StyledColorGridButton } from "./ColorGrid.styled";
import { COLORS as appsmithColors } from "./colors";

const clean = (value: number) => {
  return Math.round(parseFloat((value * 10 ** 3).toFixed(3))) / 10 ** 3;
};

const getColorString = (color: Color, colorSpace: "oklch" | "hex") => {
  if (colorSpace === "oklch") {
    const lch = color.oklch;
    return `${clean(lch.l)} ${clean(lch.c)} ${clean(lch.h)}`;
  }

  return color.toString({ format: "hex" });
};

const getTestObj = (steps: number, source: "oklch" | "hex") => {
  const obj = {};
  const LRatio = 1 / (steps - 1);
  const CRatio = 0.4 / (steps - 1);
  const HRatio = 360 / (steps - 1);

  for (let i = 0; i < steps; i++) {
    // @ts-expect-error for some reason
    obj[i] = {};
    for (let k = 0; k < steps; k++) {
      const l = clean(k * LRatio);
      const c = clean(k * CRatio);
      const h = clean(i * HRatio);

      const color = new Color("#000")
        .set("oklch.l", l)
        .set("oklch.c", c)
        .set("oklch.h", h);
      // @ts-expect-error for some reason
      obj[i][`${l} ${c} ${h}`] =
        source === "oklch" ? color : color.toString({ format: "hex" });
    }
  }

  return obj;
};

export const ColorGrid = (props: any) => {
  const {
    children,
    colorMode,
    colorSpace,
    isActive,
    isDisabled,
    isFocused,
    isHovered,
    size,
    source,
    steps,
    variant,
  } = props;

  const currentSize = source === "appsmith" ? "small" : size;

  const columns = () => {
    return source === "appsmith" ? 10 : steps;
  };

  const COLORS =
    source === "appsmith" ? appsmithColors : getTestObj(columns(), source);

  const secondColorName = () => {
    if (variant === "primary") {
      switch (true) {
        case isActive:
          return "bgAccentActive";
        case isHovered:
          return "bgAccentHover";
        default:
          return "bgAccent";
      }
    }

    switch (true) {
      case isActive:
        return "bgAccentSubtleActive";
      case isHovered:
        return "bgAccentSubtleHover";
      default:
        return "bgAccent";
    }
  };

  return (
    <div>
      first line — seedColor
      <br />
      second line — {secondColorName()}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns()}, 1fr)`,
          gap: `${currentSize === "small" ? "8px" : "20px"}`,
          padding: `${currentSize === "small" ? "8px" : "20px"}`,
          background: "#fff",
          marginTop: "12px",
        }}
      >
        {Object.keys(COLORS).map((colorKey) => {
          // @ts-expect-error for some reason
          return Object.keys(COLORS[colorKey]).map((colorNestedKey) => {
            // @ts-expect-error for some reason
            const seedColor = COLORS[colorKey][colorNestedKey];

            const tokensAccessor = new TokensAccessor({
              rootUnit: 4,
              typography: {
                ...defaultTokens.typography,
                footnote: {
                  capHeightRatio: 1.4,
                  lineGapRatio: 1,
                },
              },
              seedColor,
              colorMode: colorMode,
            });

            const tokens =
              colorMode === "light" || colorMode === undefined
                ? new LightModeTheme(seedColor)
                : new DarkModeTheme(seedColor);

            const getSeed = () => {
              // @ts-expect-error color is private
              return getColorString(tokens.seedColor, colorSpace);
            };

            const getDerived = () => {
              if (variant === "primary") {
                switch (true) {
                  case isActive:
                    // @ts-expect-error color is private
                    return getColorString(tokens.bgAccentActive, colorSpace);
                  case isHovered:
                    // @ts-expect-error color is private
                    return getColorString(tokens.bgAccentHover, colorSpace);
                  default:
                    // @ts-expect-error color is private
                    return getColorString(tokens.bgAccent, colorSpace);
                }
              }

              switch (true) {
                case isActive:
                  return getColorString(
                    // @ts-expect-error color is private
                    tokens.bgAccentSubtleActive,
                    colorSpace,
                  );
                case isHovered:
                  // @ts-expect-error color is private
                  return getColorString(tokens.bgAccentSubtleHover, colorSpace);
                default:
                  // @ts-expect-error color is private
                  return getColorString(tokens.bgAccent, colorSpace);
              }
            };

            return (
              <ThemeProvider
                key={seedColor}
                theme={tokensAccessor.getAllTokens()}
              >
                <div
                  style={{
                    padding: `${currentSize === "small" ? "12px" : "90px"}`,
                    background: "var(--color-bg)",
                  }}
                >
                  <StyledColorGridButton
                    data-active={isActive ? "" : undefined}
                    data-disabled={isDisabled ? "" : undefined}
                    data-focused={isFocused ? "" : undefined}
                    data-hovered={isHovered ? "" : undefined}
                    data-variant={variant}
                  >
                    <Text lineClamp={2} textAlign="center" variant="footnote">
                      {children({
                        seed: getSeed(),
                        derived: getDerived(),
                      })}
                    </Text>
                  </StyledColorGridButton>
                </div>
              </ThemeProvider>
            );
          });
        })}
      </div>
    </div>
  );
};
