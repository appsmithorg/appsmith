import { useSelector } from "react-redux";

import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { useLayoutEffect } from "react";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { APPSMITH_BRAND_PRIMARY_COLOR } from "utils/BrandingUtils";
import { LightModeTheme } from "@design-system/theming";

const useBrandingTheme = () => {
  const config = useSelector(getTenantConfig);
  const localOverrideBrandColors = {
    primary: "#8A2EB6", // Translated from #E15615
    background: "#F1F5F9", // Keeping the same as it is a neutral color
    hover: "#7E30C7", // Translated from #6d1fb0
    active: "#6D1FB0", // Translated from #5c0e99
    font: "#FFFFFF", // Keeping the same as it is a neutral color
    disabled: "#D8B6FA", // Translated from #ebdef7
  };

  config.brandColors = localOverrideBrandColors;

  let activeColor: string | undefined = undefined;
  if (
    config.brandColors.primary !== undefined &&
    (config.brandColors.active === undefined ||
      config.brandColors.active === "")
  ) {
    const lightTheme = new LightModeTheme(config.brandColors.primary);
    activeColor =
      config.brandColors.primary === APPSMITH_BRAND_PRIMARY_COLOR
        ? getComputedStyle(document.documentElement).getPropertyValue(
            "--ads-v2-color-bg-brand-emphasis-plus",
          )
        : lightTheme.bgAccentActive.toString({ format: "hex" });
  }

  useLayoutEffect(() => {
    const cssVariables: Record<string, string> = {
      "bg-brand": config.brandColors.primary,
      "fg-brand": config.brandColors.primary,
      "border-brand": config.brandColors.primary,
      // TODO:(Albin) Remove this once branding and new DS is fully integrated
      "background-secondary": config.brandColors.background,
      "bg-brand-emphasis": config.brandColors.hover,
      "bg-brand-emphasis-plus": activeColor || config.brandColors.active,
      "fg-brand-emphasis": config.brandColors.hover,
      "border-brand-emphasis": config.brandColors.hover,
      "border-brand-emphasis-plus": activeColor || config.brandColors.active,
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

    favicon.href = getAssetUrl(config.brandFaviconUrl);
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
