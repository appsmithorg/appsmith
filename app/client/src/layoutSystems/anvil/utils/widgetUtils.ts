import { MOBILE_BREAKPOINT } from "./constants";

/**
 * Updates minWidth style for the widget based on its responsiveBehavior:
 * A Fill widget will expand to assume 100% of its parent's width when its parent width < 480px.
 * For other situations, it will adopt the minWidth provided in its widget config.
 * @param config Record<string, string | number> | undefined
 * @returns Record<string, string | number> | undefined
 */
export const getResponsiveMinWidth = (
  config: Record<string, string | number> | undefined,
  isFillWidget: boolean,
): Record<string, string | number> | undefined => {
  if (!config)
    return isFillWidget
      ? { base: "100%", [`${MOBILE_BREAKPOINT}px`]: "" }
      : undefined;
  if (!isFillWidget) return config;
  const minWidth = config["base"];
  return {
    ...config,
    base: "100%",
    [`${MOBILE_BREAKPOINT}px`]: config[`${MOBILE_BREAKPOINT}px`] || minWidth,
  };
};
