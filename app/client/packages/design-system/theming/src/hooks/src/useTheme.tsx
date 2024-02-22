import Color from "colorjs.io";
import { useEffect, useState } from "react";
import { TokensAccessor, defaultTokens, tokensConfigs } from "../../token";
import { useSizing, useSpacing, useTypography } from "./";

import type { ColorMode } from "../../color";
import type { TokenSource, FontFamily, IconStyle } from "../../token";
import { useIconDensity } from "./useIconDensity";
import { useIconSizing } from "./useIconSizing";

const tokensAccessor = new TokensAccessor({
  ...(defaultTokens as TokenSource),
});

export interface UseThemeProps {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  fontFamily?: FontFamily;
  userDensity?: number;
  userSizing?: number;
  iconStyle?: IconStyle;
}

export function useTheme(props: UseThemeProps = {}) {
  const {
    borderRadius,
    colorMode = "light",
    fontFamily,
    iconStyle = "outlined",
    seedColor,
    userDensity = 1,
    userSizing = 1,
  } = props;

  const { sizing } = useSizing(tokensConfigs.sizing, userDensity, userSizing);
  const { innerSpacing, outerSpacing } = useSpacing(
    tokensConfigs.outerSpacing,
    tokensConfigs.innerSpacing,
    userDensity,
    userSizing,
  );
  const { typography } = useTypography(
    tokensConfigs.typography,
    fontFamily,
    userDensity,
    userSizing,
  );

  const { iconSize } = useIconSizing(tokensConfigs.icon.sizing, userSizing);

  const { strokeWidth } = useIconDensity(
    tokensConfigs.icon.density,
    userDensity,
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
      tokensAccessor.updateBorderRadiusElevation({
        ...defaultTokens.borderRadiusElevation,
        base: borderRadius,
      });

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getBorderRadiusElevation(),
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

  useEffect(() => {
    if (iconStyle) {
      tokensAccessor.updateIconStyle(iconStyle);

      setTheme((prevState) => {
        return {
          ...prevState,
          iconStyle: tokensAccessor.getIconStyle(),
        };
      });
    }
  }, [iconStyle]);

  useEffect(() => {
    if (iconSize != null) {
      tokensAccessor.updateIconSize(iconSize);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getIconSize(),
        };
      });
    }
  }, [iconSize]);

  useEffect(() => {
    if (strokeWidth != null) {
      tokensAccessor.updateStrokeWidth(strokeWidth);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getStrokeWidth(),
        };
      });
    }
  }, [strokeWidth]);

  return { theme, setTheme };
}
