import Color from "colorjs.io";
import { useEffect, useState } from "react";
import type { TokenSource } from "@design-system/theming";
import { TokensAccessor, defaultTokens } from "@design-system/theming";

import type { UseThemeProps } from "./types";

const tokensAccessor = new TokensAccessor(defaultTokens as TokenSource);

export function useTheme(props: UseThemeProps) {
  const { borderRadius, colorMode, fontFamily, rootUnit, seedColor } = props;

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

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
      tokensAccessor.updateFontFamily(fontFamily);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getTypography(),
        };
      });
    }
  }, [fontFamily]);

  useEffect(() => {
    if (rootUnit) {
      tokensAccessor.updateRootUnit(defaultTokens.rootUnit * rootUnit);

      setTheme((prevState) => {
        return {
          ...prevState,
          rootUnit: tokensAccessor.getRootUnit(),
          ...tokensAccessor.getSpacing(),
          ...tokensAccessor.getTypography(),
        };
      });
    }
  }, [rootUnit]);

  return { theme, setTheme };
}
