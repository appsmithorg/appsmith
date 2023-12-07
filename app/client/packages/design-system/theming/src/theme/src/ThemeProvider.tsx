import React, { useRef } from "react";
import { injectGlobal } from "@emotion/css";
import { globalFontStack } from "../../utils/globalFontStack";
import { ThemeContext } from "./ThemeContext";
import clsx from "clsx";
import { useDebounce } from "@react-hook/debounce";
import useResizeObserver from "@react-hook/resize-observer";
import { useCssTokens } from "../../hooks";

import type { ThemeProviderProps } from "./types";
import type { RefObject } from "react";

injectGlobal(globalFontStack());

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, className, style, theme } = props;
  const [width, setWidth] = useDebounce<number | null>(null, 100);
  const providerRef = useRef(null);

  useResizeObserver(providerRef as RefObject<HTMLElement>, (entry) =>
    setWidth(entry.contentRect.width),
  );

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
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
