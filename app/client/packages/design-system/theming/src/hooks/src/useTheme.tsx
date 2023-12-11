import Color from "colorjs.io";
import { useEffect, useState } from "react";
import { TokensAccessor, defaultTokens } from "../../token";
import { useFluidSizing, useFluidSpacing, useFluidTypography } from "./";

import type { ColorMode } from "../../color";
import type { TokenSource, FontFamily } from "../../token";

const { fluid, ...restDefaultTokens } = defaultTokens;

const tokensAccessor = new TokensAccessor({
  ...(restDefaultTokens as TokenSource),
});

export interface UseThemeProps {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  fontFamily?: FontFamily;
  userDensity?: number;
  userSizing?: number;
}

export function useTheme(props: UseThemeProps = {}) {
  const {
    borderRadius,
    colorMode = "light",
    fontFamily,
    seedColor,
    userDensity = 1,
    userSizing = 1,
  } = props;

  const { sizing } = useFluidSizing(fluid, userDensity, userSizing);
  const { innerSpacing, outerSpacing } = useFluidSpacing(
    fluid,
    userDensity,
    userSizing,
  );
  const { typography } = useFluidTypography(
    fluid,
    fontFamily,
    userDensity,
    userSizing,
  );

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens);

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
        return; // Prevent further execution if color parsing fails
      }

      if (color != null) {
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
    // Check typography, as fontFamily may be undefined
    if (typography != null) {
      tokensAccessor.updateFontFamily(fontFamily);
      tokensAccessor.updateTypography(typography);

      setTheme((prevState) => {
        return {
          ...prevState,
          typography: tokensAccessor.getTypography(),
          fontFamily: tokensAccessor.getFontFamily(),
        };
      });
    }
  }, [typography, fontFamily]);

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

  return { theme, setTheme };
}
