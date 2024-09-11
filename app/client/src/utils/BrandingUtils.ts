import tinycolor from "tinycolor2";
import { darkenColor } from "widgets/WidgetUtils";
import {
  createMessage,
  ADMIN_BRANDING_LOGO_SIZE_ERROR,
  ADMIN_BRANDING_LOGO_FORMAT_ERROR,
  ADMIN_BRANDING_FAVICON_SIZE_ERROR,
  ADMIN_BRANDING_FAVICON_FORMAT_ERROR,
  ADMIN_BRANDING_FAVICON_DIMENSION_ERROR,
} from "ee/constants/messages";
import { toast } from "@appsmith/ads";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { LightModeTheme } from "@appsmith/wds-theming";

const FAVICON_MAX_WIDTH = 32;
const FAVICON_MAX_HEIGHT = 32;
const DEFAULT_BRANDING_PRIMARY_COLOR = "#E15615";
export const APPSMITH_BRAND_PRIMARY_COLOR =
  getComputedStyle(document.documentElement).getPropertyValue(
    "--ads-v2-color-bg-brand",
  ) || DEFAULT_BRANDING_PRIMARY_COLOR;
export const APPSMITH_BRAND_BG_COLOR = "#F1F5F9";
export const APPSMITH_BRAND_FAVICON_URL = getAssetUrl(
  `${ASSETS_CDN_URL}/appsmith-favicon-orange.ico`,
);
export const APPSMITH_BRAND_LOGO_URL = getAssetUrl(
  `${ASSETS_CDN_URL}/appsmith-logo-no-margin.png`,
);

/**
 * create brand colors from primary color
 *
 * @param brand
 */
export function createBrandColorsFromPrimaryColor(
  brand: string = DEFAULT_BRANDING_PRIMARY_COLOR,
) {
  const hsl = tinycolor(brand).toHsl();
  const hue = hsl.h;
  const saturation = hsl.s;
  // initialize light theme
  const lightTheme = new LightModeTheme(brand);

  let textColor = "#000";
  const isReadable = tinycolor.isReadable(brand, "#000", {
    level: "AAA",
    size: "small",
  });

  // if the brand color is not readable or the color is appsmith orange, use white as the text color
  if (isReadable === false || brand === APPSMITH_BRAND_PRIMARY_COLOR) {
    textColor = "#fff";
  }

  let bgColor = `#${tinycolor(`hsl ${hue} ${saturation} ${98}}`).toHex()}`;

  // if the primary color is appsmith orange, use gray shade for the bg color
  if (brand === APPSMITH_BRAND_PRIMARY_COLOR) {
    bgColor = APPSMITH_BRAND_BG_COLOR;
  }

  const disabledColor = `#${tinycolor(
    `hsl ${hue} ${saturation} ${92}}`,
  ).toHex()}`;
  const hoverColor =
    brand === APPSMITH_BRAND_PRIMARY_COLOR
      ? getComputedStyle(document.documentElement).getPropertyValue(
          "--ads-v2-color-bg-brand-emphasis",
        )
      : darkenColor(brand);

  // get active color from color algorithm
  const activeColor =
    brand === APPSMITH_BRAND_PRIMARY_COLOR
      ? getComputedStyle(document.documentElement).getPropertyValue(
          "--ads-v2-color-bg-brand-emphasis-plus",
        )
      : lightTheme.bgAccentActive.toString({ format: "hex" });
  return {
    primary: brand,
    background: bgColor,
    hover: hoverColor,
    active: activeColor,
    font: textColor,
    disabled: disabledColor,
  };
}

/**
 * validates the uploaded logo file
 *
 *  checks:
 *  1. file size max 2MB
 *  2. file type - jpg, or png
 *
 * @param e
 * @param callback
 * @returns
 */
export const logoImageValidator = (
  e: React.ChangeEvent<HTMLInputElement>,
  callback?: (e: React.ChangeEvent<HTMLInputElement>) => void,
) => {
  const file = e.target.files?.[0];

  // case 1: no file selected
  if (!file) return false;

  // case 2: file size > 2mb
  if (file.size > 2 * 1024 * 1024) {
    toast.show(createMessage(ADMIN_BRANDING_LOGO_SIZE_ERROR), {
      kind: "error",
    });

    return false;
  }

  // case 3: check image type
  const validTypes = ["image/jpeg", "image/png"];

  if (!validTypes.includes(file.type)) {
    toast.show(createMessage(ADMIN_BRANDING_LOGO_FORMAT_ERROR), {
      kind: "error",
    });

    return false;
  }

  // case 4: check image dimension
  const image = new Image();
  image.src = window.URL.createObjectURL(file);

  callback && callback(e);
};

/**
 * validates the uploaded favicon file
 *
 *  checks:
 *  1. file size max 2MB
 *  2. file type - jpg, ico or png
 *  3. file dimensions - height, width = [32, 32]
 *
 * @param e
 * @param callback
 * @returns
 */
export const faivconImageValidator = (
  e: React.ChangeEvent<HTMLInputElement>,
  callback?: (e: React.ChangeEvent<HTMLInputElement>) => void,
) => {
  const file = e.target.files?.[0];

  // case 1: no file selected
  if (!file) return false;

  // case 2: file size > 1mb
  if (file.size > 1 * 1024 * 1024) {
    toast.show(createMessage(ADMIN_BRANDING_FAVICON_SIZE_ERROR), {
      kind: "error",
    });

    return false;
  }

  // case 3: check image type
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/vnd.microsoft.icon",
    "image/x-icon",
    "image/x-image",
  ];

  if (!validTypes.includes(file.type)) {
    toast.show(createMessage(ADMIN_BRANDING_FAVICON_FORMAT_ERROR), {
      kind: "error",
    });

    return false;
  }

  // case 4: check image dimension
  const image = new Image();
  image.src = window.URL.createObjectURL(file);

  image.onload = function () {
    const height = image.naturalHeight;
    const width = image.naturalWidth;

    window.URL.revokeObjectURL(image.src);

    if (height > FAVICON_MAX_HEIGHT || width > FAVICON_MAX_WIDTH) {
      toast.show(createMessage(ADMIN_BRANDING_FAVICON_DIMENSION_ERROR), {
        kind: "error",
      });

      return false;
    }

    callback && callback(e);
  };
};

// NOTE: the reason why the json parsing is out of selector is we don't
// want to do the parsing everytime selector is called
let cachedTenantConfigParsed = {};
const cachedTenantConfig = localStorage.getItem("tenantConfig");

try {
  if (cachedTenantConfig) {
    cachedTenantConfigParsed = JSON.parse(cachedTenantConfig);
  }
} catch (e) {}

export { cachedTenantConfigParsed };
