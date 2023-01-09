import tinycolor from "tinycolor2";
import { useSelector } from "react-redux";

import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { useEffect } from "react";

const useBrandingTheme = () => {
  const config = useSelector(getTenantConfig);

  useEffect(() => {
    const hsl = tinycolor(config.brandColors.primary).toHsl();
    const hue = hsl.h;
    const saturation = hsl.s;

    const cssVariables: Record<string, string> = {
      brand: config.brandColors.primary,
      "background-secondary": config.brandColors.background,
      "brand-hover": config.brandColors.hover,
      "brand-text": config.brandColors.font,
      "brand-disabled": config.brandColors.disabled,
      "brand-light": `#${tinycolor(`hsl ${hue} ${saturation} ${98}}`).toHex()}`,
    };

    // Create a CSS variable for each color
    for (let i = 0; i < Object.keys(cssVariables).length; i++) {
      const key = Object.keys(cssVariables)[i];
      const value = Object.values(cssVariables)[i];

      document.documentElement.style.setProperty(`--ads-color-${key}`, value);
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
