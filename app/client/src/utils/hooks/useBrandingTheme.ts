import { useSelector } from "react-redux";

import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { useEffect } from "react";

const useBrandingTheme = () => {
  const config = useSelector(getTenantConfig);

  useEffect(() => {
    const cssVariables: Record<string, string> = {
      "bg-brand": config.brandColors.primary,
      "fg-brand": config.brandColors.primary,
      "border-brand": config.brandColors.primary,
      // TODO:(Albin) Remove this once branding and new DS is fully integrated
      "background-secondary": config.brandColors.background,
      "bg-brand-emphasis": config.brandColors.hover,
      "fg-brand-emphasis": config.brandColors.hover,
      "border-brand-emphasis": config.brandColors.hover,
      "fg-on-brand": config.brandColors.font,
    };

    // Create a CSS variable for each color
    for (let i = 0; i < Object.keys(cssVariables).length; i++) {
      const key = Object.keys(cssVariables)[i];
      const value = Object.values(cssVariables)[i];
      const prefix =
        key === "background-secondary" ? "--ads-color-" : "--ads-v2-color-";

      document.documentElement.style.setProperty(`${prefix}${key}`, value);
    }

    // Set the favicon
    let favicon: any = document.querySelector("link[rel='shortcut icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "shortcut icon";
      favicon.className = "t--branding-favicon";
      document.getElementsByTagName("head")[0].appendChild(favicon);
    }

    favicon.href = config.brandFaviconUrl;
  }, [
    config.brandColors.primary,
    config.brandColors.background,
    config.brandColors.hover,
    config.brandColors.font,
    config.brandColors.disabled,
    config.brandFaviconUrl,
  ]);
};

export default useBrandingTheme;
