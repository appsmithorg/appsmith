import tinycolor from "tinycolor2";
import { darkenColor } from "widgets/WidgetUtils";
import { Toaster, Variant } from "design-system";
import {
  createMessage,
  ADMIN_BRANDING_LOGO_SIZE_ERROR,
  ADMIN_BRANDING_LOGO_FORMAT_ERROR,
  ADMIN_BRANDING_FAVICON_SIZE_ERROR,
  ADMIN_BRANDING_FAVICON_FORMAT_ERROR,
  ADMIN_BRANDING_FAVICON_DIMENSION_ERROR,
} from "@appsmith/constants/messages";

const FAVICON_MAX_WIDTH = 32;
const FAVICON_MAX_HEIGHT = 32;
const DEFAULT_BRANDING_PRIMARY_COLOR = "#D7D7D7";
export const APPSMITH_BRAND_PRIMARY_COLOR = "#F86A2B";

/**
 * create brand colors from primary color
 *
 * @param color
 */
export function createBrandColorsFromPrimaryColor(
  brand: string = DEFAULT_BRANDING_PRIMARY_COLOR,
) {
  const hsl = tinycolor(brand).toHsl();
  const hue = hsl.h;
  const saturation = hsl.s;

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
    bgColor = "#F8F9FA";
  }

  const disabledColor = `#${tinycolor(
    `hsl ${hue} ${saturation} ${92}}`,
  ).toHex()}`;
  const hoverColor = darkenColor(brand);

  return {
    primary: brand,
    background: bgColor,
    hover: hoverColor,
    font: textColor,
    disabled: disabledColor,
  };
}

/**
 * validates the uploaded logo file
 *
 *  checks:
 *  1. file size max 2MB
 *  2. file type - jpg, svg or png
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
    Toaster.show({
      text: createMessage(ADMIN_BRANDING_LOGO_SIZE_ERROR),
      variant: Variant.danger,
    });

    return false;
  }

  // case 3: image selected
  const validTypes = ["image/jpeg", "image/png", "image/svg+xml"];

  if (!validTypes.includes(file.type)) {
    Toaster.show({
      text: createMessage(ADMIN_BRANDING_LOGO_FORMAT_ERROR),
      variant: Variant.danger,
    });

    return false;
  }

  // case 4: check size
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

  // case 2: file size > 2mb
  if (file.size > 2 * 1024 * 1024) {
    Toaster.show({
      text: createMessage(ADMIN_BRANDING_FAVICON_SIZE_ERROR),
      variant: Variant.danger,
    });

    return false;
  }

  // case 3: image selected
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/vnd.microsoft.icon",
    "image/x-icon",
    "image/x-image",
  ];

  if (!validTypes.includes(file.type)) {
    Toaster.show({
      text: createMessage(ADMIN_BRANDING_FAVICON_FORMAT_ERROR),
      variant: Variant.danger,
    });

    return false;
  }

  // case 4: check size
  const image = new Image();
  image.src = window.URL.createObjectURL(file);

  image.onload = function() {
    const height = image.naturalHeight;
    const width = image.naturalWidth;

    window.URL.revokeObjectURL(image.src);

    if (height > FAVICON_MAX_HEIGHT || width > FAVICON_MAX_WIDTH) {
      Toaster.show({
        text: createMessage(ADMIN_BRANDING_FAVICON_DIMENSION_ERROR),
        variant: Variant.danger,
      });

      return false;
    }

    callback && callback(e);
  };
};
