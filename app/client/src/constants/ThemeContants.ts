export const bindingPrefix = "appsmith.theme";

export const getThemePropertyBinding = (property: string) =>
  `{{${bindingPrefix}.${property}}}`;

export const borderRadiusPropertyName = "borderRadius";

export const borderRadiusOptions: Record<string, string> = {
  none: "0px",
  md: "0.375rem",
  lg: "1.5rem",
  full: "9999px",
};

export const boxShadowPropertyName = "boxShadow";

export const boxShadowOptions: Record<string, string> = {
  none: "none",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

export const colorsPropertyName = "colors";
