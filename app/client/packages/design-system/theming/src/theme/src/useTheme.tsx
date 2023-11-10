import Color from "colorjs.io";
import { useEffect, useState } from "react";
import type { TokenSource } from "@design-system/theming";
import {
  TokensAccessor,
  defaultTokens,
  useFluidTokens,
} from "@design-system/theming";

import type { UseThemeProps } from "./types";

const { fluid, ...restDefaultTokens } = defaultTokens;

const tokensAccessor = new TokensAccessor({
  ...(restDefaultTokens as TokenSource),
});

export function useTheme(props: UseThemeProps = {}) {
  const {
    borderRadius,
    colorMode = "light",
    fontFamily,
    seedColor,
    userDensity = 1,
    userSizing = 1,
  } = props;

  const { innerSpacing, outerSpacing, sizing, typography } = useFluidTokens(
    fluid,
    userDensity,
    userSizing,
  );

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

  useEffect(() => {
    if (colorMode) {
      tokensAccessor.updateColorMode(colorMode);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getColors(),
          colorMode: tokensAccessor.getColorMode(),
        };
      });
    }
  }, [colorMode]);

  useEffect(() => {
    if (borderRadius != null) {
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
    if (seedColor != null) {
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
    tokensAccessor.updateFontFamily(fontFamily);

    setTheme((prevState) => {
      return {
        ...prevState,
        typography: tokensAccessor.getTypography(),
        fontFamily: tokensAccessor.getFontFamily(),
      };
    });
  }, [fontFamily]);

  useEffect(() => {
    if (sizing) {
      tokensAccessor.updateSizing(sizing);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getSizing(),
        };
      });
    }
  }, [sizing]);

  useEffect(() => {
    if (outerSpacing) {
      tokensAccessor.updateOuterSpacing(outerSpacing);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getOuterSpacing(),
        };
      });
    }
  }, [outerSpacing]);

  useEffect(() => {
    if (innerSpacing) {
      tokensAccessor.updateInnerSpacing(innerSpacing);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getInnerSpacing(),
        };
      });
    }
  }, [innerSpacing]);

  useEffect(() => {
    if (typography) {
      tokensAccessor.updateTypography(typography);

      setTheme((prevState) => {
        return {
          ...prevState,
          typography: tokensAccessor.getTypography(),
        };
      });
    }
  }, [typography]);

  return { theme, setTheme };
}
