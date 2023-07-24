import Color from "colorjs.io";
import { useEffect, useState } from "react";
import type { ColorMode, FontFamily } from "@design-system/theming";
import {
  TokensAccessor,
  defaultTokens,
  useFluidTokens,
} from "@design-system/theming";

import type { UseThemeProps } from "./types";

export function useTheme(props: UseThemeProps) {
  const {
    borderRadius,
    colorMode = "light",
    fontFamily,
    rootUnitRatio: rootUnitRatioProp,
    seedColor,
  } = props;

  const [rootUnitRatio, setRootUnitRatio] = useState(1);
  const { fluid, ...restDefaultTokens } = defaultTokens;

  const { rootUnit, sizing, spacing, typography } = useFluidTokens(
    fluid,
    rootUnitRatio,
  );

  const tokensAccessor = new TokensAccessor({
    ...restDefaultTokens,
    rootUnit,
    spacing,
    sizing,
    typography,
    colorMode: colorMode as ColorMode,
  });

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

  const updateFontFamily = (fontFamily: FontFamily) => {
    tokensAccessor.updateFontFamily(fontFamily);

    setTheme((prevState) => {
      return {
        ...prevState,
        typography: tokensAccessor.getTypography(),
      };
    });
  };

  useEffect(() => {
    if (colorMode) {
      tokensAccessor.updateColorMode(colorMode);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getColors(),
        };
      });
    }
  }, [colorMode]);

  useEffect(() => {
    if (borderRadius) {
      tokensAccessor.updateBorderRadius({
        1: borderRadius,
      });

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getBorderRadius(),
        };
      });
    }
  }, [borderRadius]);

  useEffect(() => {
    if (seedColor) {
      let color;

      try {
        color = Color.parse(seedColor);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      if (color) {
        tokensAccessor.updateSeedColor(seedColor);

        setTheme((prevState) => {
          return {
            ...prevState,
            ...tokensAccessor.getColors(),
          };
        });
      }
    }
  }, [seedColor]);

  useEffect(() => {
    if (fontFamily) {
      updateFontFamily(fontFamily);
    }
  }, [fontFamily]);

  useEffect(() => {
    if (rootUnitRatioProp) {
      setRootUnitRatio(rootUnitRatioProp);
      tokensAccessor.updateRootUnit(rootUnit);
      tokensAccessor.updateSpacing(spacing);

      setTheme((prevState) => {
        return {
          ...prevState,
          rootUnit: tokensAccessor.getRootUnit(),
          ...tokensAccessor.getSpacing(),
        };
      });
    }
  }, [rootUnitRatioProp]);

  useEffect(() => {
    tokensAccessor.updateTypography(typography);

    setTheme((prevState) => {
      return {
        ...prevState,
        typography: tokensAccessor.getTypography(),
      };
    });
  }, [typography]);

  return { theme, setTheme };
}
