import clsx from "clsx";
import React, { useRef } from "react";
import type { RefObject } from "react";
import { injectGlobal } from "@emotion/css";
import { useDebounce } from "@react-hook/debounce";

import { useCssTokens } from "../../hooks";
import { ThemeContext } from "./ThemeContext";
import { globalFontStack } from "../../utils/globalFontStack";
import useResizeObserver from "@react-hook/resize-observer";

import type { ThemeProviderProps } from "./types";

injectGlobal(globalFontStack());

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, style, theme } = props;
  const [width, setWidth] = useDebounce<number | null>(null, 100);
  const providerRef = useRef(null);

  useResizeObserver(providerRef as RefObject<HTMLElement>, (entry) => {
    setWidth(entry.contentRect.width);
  });

  const {
    colorClassName,
    colorModeClassName,
    fontFamilyClassName,
    providerClassName,
    typographyClassName,
    widthClassName,
  } = useCssTokens({ ...theme, width });

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={clsx(
          className,
          colorClassName,
          colorModeClassName,
          fontFamilyClassName,
          providerClassName,
          typographyClassName,
          widthClassName,
        )}
        data-theme-provider=""
        ref={providerRef}
        style={style}
      >
        {Boolean(width) && children}
      </div>
    </ThemeContext.Provider>
  );
};
