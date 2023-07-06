import Color from "colorjs.io";
import { useEffect, useState } from "react";
import type { ColorMode } from "@design-system/theming";
import { TokensAccessor, defaultTokens } from "@design-system/theming";

type UseThemeProps = {
  seedColor?: string;
  colorMode?: ColorMode;
  borderRadius?: string;
};

export function useTheme(props: UseThemeProps) {
  const {
    borderRadius = "0px",
    colorMode = "light",
    seedColor = "#000",
  } = props;

  const tokensAccessor = new TokensAccessor({
    ...defaultTokens,
    borderRadius: {
      "1": borderRadius,
    },
    colorMode,
    seedColor,
  });

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

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

  return { theme, setTheme };
}
