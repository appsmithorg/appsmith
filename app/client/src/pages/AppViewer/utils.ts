import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { Colors } from "constants/Colors";
import tinycolor from "tinycolor2";
import {
  calulateHoverColor,
  getComplementaryGrayscaleColor,
  isLightColor,
} from "widgets/WidgetUtils";

// Menu Item Background Color - Active
export const getMenuItemBackgroundColorWhenActive = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
) => {
  const colorHsl = tinycolor(color).toHsl();

  switch (navColorStyle) {
    case NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT: {
      if (isLightColor(color)) {
        colorHsl.l -= 0.1;

        return tinycolor(colorHsl).toHexString();
      } else {
        colorHsl.l += 0.35;
        colorHsl.a = 0.3;

        return tinycolor(colorHsl).toHex8String();
      }
    }
    case NAVIGATION_SETTINGS.COLOR_STYLE.THEME: {
      return calulateHoverColor(color);
    }
  }
};

// Menu Item Background Color - Hover
export const getMenuItemBackgroundColorOnHover = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
) => {
  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    return Colors.GREY_3;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME) {
    return tinycolor(calulateHoverColor(color)).toHexString();
  }
};

// Menu Item Text Color - Default, Hover, Active
export const getMenuItemTextColor = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
  isDefaultState = false,
) => {
  switch (navColorStyle) {
    case NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT: {
      const resultantColor: tinycolor.ColorFormats.HSLA | string =
        tinycolor(color).toHsl();

      if (isDefaultState) {
        return Colors.GREY_9;
      }

      if (isLightColor(color)) {
        resultantColor.l += 0.35;

        return tinycolor(resultantColor).toHexString();
      } else {
        if (resultantColor.l <= 0.05) {
          /**
           * if the color is close to black, it will have a near transparent background
           * due to the getMenuItemBackgroundColorWhenActive function.
           * Therefore, only black text will be accessible and suitable in this case.
           */
          return Colors.BLACK;
        } else if (resultantColor.l > 0.05 && resultantColor.l <= 0.15) {
          // if the color is extremely dark
          return getComplementaryGrayscaleColor(color);
        } else {
          resultantColor.l -= 0.1;

          return tinycolor(resultantColor).toHexString();
        }
      }
    }
    case NAVIGATION_SETTINGS.COLOR_STYLE.THEME: {
      return getComplementaryGrayscaleColor(color);
    }
  }
};

// Menu Container Background Color
export const getMenuContainerBackgroundColor = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
) => {
  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    return Colors.WHITE;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME) {
    return color;
  }
};

export const getApplicationNameTextColor = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
) => {
  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    return Colors.GREY_9;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME) {
    return getComplementaryGrayscaleColor(color);
  }
};

export const getSignInButtonStyles = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
) => {
  const styles = {
    background: Colors.WHITE,
    backgroundOnHover: Colors.GRAY_100,
    color: Colors.BLACK,
  };

  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    styles.background = color;
    styles.color = getComplementaryGrayscaleColor(color);
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME) {
    styles.background = getComplementaryGrayscaleColor(color);
    styles.color = isLightColor(color) ? Colors.WHITE : color;
  }

  styles.backgroundOnHover = calulateHoverColor(styles.background, false);

  return styles;
};
