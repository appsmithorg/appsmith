import * as React from "react";
import { useEffect, useState } from "react";
import * as webfontloader from "webfontloader";
import styled from "styled-components";
import {
  ThemeProvider,
  TokensAccessor,
  defaultTokens,
  useFluidTokens,
} from "@design-system/theming";
import Color from "colorjs.io";

const StyledThemeProvider = styled(ThemeProvider)`
  display: inline-flex;
  min-width: 100%;
  min-height: 100%;
  padding: 16px;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  color: var(--color-fg);
`;

export const theming = (Story, args) => {
  const [rootUnitRatio, setRootUnitRatio] = useState(1);
  const { fluid, ...restDefaultTokens } = defaultTokens;

  const { typography, rootUnit, spacing, sizing } = useFluidTokens(
    fluid,
    rootUnitRatio,
  );

  const tokensAccessor = new TokensAccessor({
    ...restDefaultTokens,
    rootUnit,
    spacing,
    sizing,
    typography,
  });

  const [theme, setTheme] = useState(tokensAccessor.getAllTokens());

  const updateFontFamily = (fontFamily) => {
    tokensAccessor.updateFontFamily(fontFamily);

    setTheme((prevState) => {
      return {
        ...prevState,
        typography: tokensAccessor.getTypography(),
      };
    });
  };

  useEffect(() => {
    if (args.globals.colorMode) {
      tokensAccessor.updateColorMode(args.globals.colorMode);

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getColors(),
        };
      });
    }
  }, [args.globals.colorMode]);

  useEffect(() => {
    if (args.globals.borderRadius) {
      tokensAccessor.updateBorderRadius({
        1: args.globals.borderRadius,
      });

      setTheme((prevState) => {
        return {
          ...prevState,
          ...tokensAccessor.getBorderRadius(),
        };
      });
    }
  }, [args.globals.borderRadius]);

  useEffect(() => {
    if (args.globals.accentColor) {
      let color;

      try {
        color = Color.parse(args.globals.accentColor);
      } catch (error) {
        console.error(error);
      }

      if (color) {
        tokensAccessor.updateSeedColor(args.globals.accentColor);

        setTheme((prevState) => {
          return {
            ...prevState,
            ...tokensAccessor.getColors(),
          };
        });
      }
    }
  }, [args.globals.accentColor]);

  useEffect(() => {
    if (
      args.globals.fontFamily &&
      args.globals.fontFamily !== "Arial" &&
      args.globals.fontFamily !== "System Default"
    ) {
      webfontloader.load({
        google: {
          families: [`${args.globals.fontFamily}:300,400,500,700`],
        },
        active: () => {
          updateFontFamily(args.globals.fontFamily);
        },
      });
    } else {
      updateFontFamily(args.globals.fontFamily);
    }
  }, [args.globals.fontFamily]);

  useEffect(() => {
    if (args.globals.rootUnitRatio) {
      setRootUnitRatio(args.globals.rootUnitRatio);
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
  }, [args.globals.rootUnitRatio]);

  useEffect(() => {
    tokensAccessor.updateTypography(typography);

    setTheme((prevState) => {
      return {
        ...prevState,
        typography: tokensAccessor.getTypography(),
      };
    });
  }, [typography]);

  return (
    <StyledThemeProvider theme={theme}>
      <Story />
    </StyledThemeProvider>
  );
};
