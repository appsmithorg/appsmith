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
  const { children, className, style, theme } = props;
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
  const sheetKey = useRef(uniqueId("wds-provider-"));

  useLayoutEffect(() => {
    providerStyleSheet.createSheets(sheetKey.current);

    return () => {
      providerStyleSheet.flush(sheetKey.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (borderRadius) {
      providerStyleSheet.borderRadius(sheetKey.current, borderRadius);
    }
  }, [borderRadius]);

  useLayoutEffect(() => {
    if (borderWidth) {
      providerStyleSheet.borderWidth(sheetKey.current, borderWidth);
    }
  }, [borderWidth]);

  useLayoutEffect(() => {
    if (boxShadow) {
      providerStyleSheet.boxShadow(sheetKey.current, boxShadow);
    }
  }, [boxShadow]);

  useLayoutEffect(() => {
    if (color) {
      providerStyleSheet.color(sheetKey.current, color);
    }
  }, [color]);

  useLayoutEffect(() => {
    if (opacity) {
      providerStyleSheet.opacity(sheetKey.current, opacity);
    }
  }, [opacity]);

  useLayoutEffect(() => {
    if (sizing) {
      providerStyleSheet.sizing(sheetKey.current, sizing);
    }
  }, [sizing]);

  useLayoutEffect(() => {
    if (spacing) {
      providerStyleSheet.spacing(sheetKey.current, spacing);
    }
  }, [spacing]);

  useLayoutEffect(() => {
    if (zIndex) {
      providerStyleSheet.zIndex(sheetKey.current, zIndex);
    }
  }, [zIndex]);

  useLayoutEffect(() => {
    if (rootUnit) {
      providerStyleSheet.rootUnit(sheetKey.current, rootUnit);
    }
  }, [rootUnit]);

  useLayoutEffect(() => {
    if (typography) {
      providerStyleSheet.typography(sheetKey.current, typography, fontFamily);
    }
  }, [typography, fontFamily]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={clsx(className, sheetKey.current)}
        data-theme-provider=""
        style={style}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
