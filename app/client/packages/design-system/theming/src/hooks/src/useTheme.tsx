import Color from "colorjs.io";
import { useMemo } from "react";
import { TokensAccessor, defaultTokens, tokensConfigs } from "../../token";
import {
  useSizing,
  useSpacing,
  useTypography,
  useIconSizing,
  useIconDensity,
} from "./";

import type { ColorMode } from "../../color";
import type { TokenSource, IconStyle } from "../../token";

const tokensAccessor = new TokensAccessor({
  ...(defaultTokens as TokenSource),
});

export interface UseThemeProps {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
  userDensity?: number;
  userSizing?: number;
  iconStyle?: IconStyle;
}

export function useTheme(props: UseThemeProps = {}) {
  const {
    borderRadius,
    colorMode = "light",
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
    userDensity,
    userSizing,
  );
  const { iconSize } = useIconSizing(tokensConfigs.icon.sizing, userSizing);
  const { strokeWidth } = useIconDensity(
    tokensConfigs.icon.density,
    userDensity,
  );

  const theme = useMemo(() => {
    // Color mode
    tokensAccessor.updateColorMode(colorMode);

    // Border radius
    if (borderRadius != null) {
      tokensAccessor.updateBorderRadiusElevation({
        ...defaultTokens.borderRadiusElevation,
        base: borderRadius,
      });
    }

    // Seed color
    if (seedColor != null) {
      try {
        Color.parse(seedColor);
        tokensAccessor.updateSeedColor(seedColor);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }

    // Typography
    if (typography != null) {
      tokensAccessor.updateTypography(typography);
    }

    // Sizing
    tokensAccessor.updateSizing(sizing);

    // Spacing
    tokensAccessor.updateOuterSpacing(outerSpacing);
    tokensAccessor.updateInnerSpacing(innerSpacing);

    // Icon style
    tokensAccessor.updateIconStyle(iconStyle);

    // Icon size
    if (iconSize != null) {
      tokensAccessor.updateIconSize(iconSize);
    }

    // Stroke width
    if (strokeWidth != null) {
      tokensAccessor.updateStrokeWidth(strokeWidth);
    }

    return {
      ...tokensAccessor.getAllTokens(),
      ...tokensAccessor.getColors(),
      colorMode: tokensAccessor.getColorMode(),
      ...tokensAccessor.getBorderRadiusElevation(),
      typography: tokensAccessor.getTypography(),
      ...tokensAccessor.getSizing(),
      ...tokensAccessor.getOuterSpacing(),
      ...tokensAccessor.getInnerSpacing(),
      iconStyle: tokensAccessor.getIconStyle(),
      ...tokensAccessor.getIconSize(),
      ...tokensAccessor.getStrokeWidth(),
    };
  }, [
    colorMode,
    borderRadius,
    seedColor,
    typography,
    sizing,
    outerSpacing,
    innerSpacing,
    iconStyle,
    iconSize,
    strokeWidth,
  ]);

  return { theme };
}
