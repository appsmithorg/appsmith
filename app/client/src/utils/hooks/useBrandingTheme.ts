import { useSelector } from "react-redux";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";

const useBrandingTheme = () => {
  const config = useSelector(getTenantConfig);

  const cssVariables = {
    brand: "primary",
    "background-secondary": "background",
    "brand-hover": "hover",
    "brand-text": "font",
    "brand-disabled": "disabled",
  };

  // Create a CSS variable for each color
  for (let i = 0; i < Object.keys(cssVariables).length; i++) {
    const key = Object.keys(cssVariables)[i];
    const value = Object.values(cssVariables)[i];

    document.documentElement.style.setProperty(
      `--ads-color-${key}`,
      config.brandColors[value],
    );
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
};

export default useBrandingTheme;
