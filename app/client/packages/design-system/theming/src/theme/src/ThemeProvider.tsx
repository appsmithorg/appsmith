import uniqueId from "lodash/uniqueId";
import React, { useLayoutEffect, useRef } from "react";
import { createGlobalFontStack } from "../../typography";
import { ProviderStyleSheet } from "./ProviderStyleSheet";
import { ThemeContext } from "./ThemeContext";
import clsx from "clsx";

import type { ThemeProviderProps } from "./types";

const { fontFaces } = createGlobalFontStack();
const providerStyleSheet = new ProviderStyleSheet();
providerStyleSheet.global("wds-font-faces", fontFaces);

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, theme } = props;
  const {
    borderRadius,
    borderWidth,
    boxShadow,
    color,
    fontFamily,
    opacity,
    rootUnit,
    sizing,
    spacing,
    typography,
    zIndex,
  } = theme;
  const providerSheetKey = useRef(uniqueId("wds-provider-"));

  useLayoutEffect(() => {
    providerStyleSheet.createSheets(providerSheetKey.current);

    return () => {
      providerStyleSheet.flush(providerSheetKey.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (borderRadius) {
      providerStyleSheet.borderRadius(borderRadius);
    }
  }, [borderRadius]);

  useLayoutEffect(() => {
    if (borderWidth) {
      providerStyleSheet.borderWidth(borderWidth);
    }
  }, [borderWidth]);

  useLayoutEffect(() => {
    if (boxShadow) {
      providerStyleSheet.boxShadow(boxShadow);
    }
  }, [boxShadow]);

  useLayoutEffect(() => {
    if (color) {
      providerStyleSheet.color(color);
    }
  }, [color]);

  useLayoutEffect(() => {
    if (opacity) {
      providerStyleSheet.opacity(opacity);
    }
  }, [opacity]);

  useLayoutEffect(() => {
    if (sizing) {
      providerStyleSheet.sizing(sizing);
    }
  }, [sizing]);

  useLayoutEffect(() => {
    if (spacing) {
      providerStyleSheet.spacing(spacing);
    }
  }, [spacing]);

  useLayoutEffect(() => {
    if (zIndex) {
      providerStyleSheet.zIndex(zIndex);
    }
  }, [zIndex]);

  useLayoutEffect(() => {
    if (rootUnit) {
      providerStyleSheet.rootUnit(rootUnit);
    }
  }, [rootUnit]);

  useLayoutEffect(() => {
    if (typography) {
      providerStyleSheet.typography(typography, fontFamily);
    }
  }, [typography, fontFamily]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={clsx(className, providerSheetKey.current)}
        data-theme-provider=""
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
