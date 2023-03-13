import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
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
      } else {
        colorHsl.l += 0.35;
      }

      break;
    }
    case NAVIGATION_SETTINGS.COLOR_STYLE.THEME: {
      if (isLightColor(color)) {
        colorHsl.l -= 0.2;
      } else {
        colorHsl.l += 0.2;
      }

      break;
    }
  }

  return tinycolor(colorHsl).toHexString();
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
    const colorHsl = tinycolor(color).toHsl();

    colorHsl.l = isLightColor(color) ? colorHsl.l - 0.1 : colorHsl.l + 0.1;

    return tinycolor(colorHsl).toHexString();
  }
};

// Menu Item Text Color - Default, Hover, Active
export const getMenuItemTextColor = (
  color: string,
  navColorStyle: NavigationSetting["colorStyle"] = NAVIGATION_SETTINGS
    .COLOR_STYLE.LIGHT,
  isDefaultState = false,
) => {
  let resultantColor: tinycolor.ColorFormats.HSLA | string = tinycolor(
    color,
  ).toHsl();

  switch (navColorStyle) {
    case NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT: {
      if (isDefaultState) {
        resultantColor = Colors.GREY_9;

        break;
      }

      if (isLightColor(color)) {
        resultantColor.l += 0.35;
      } else {
        if (resultantColor.l < 0.15) {
          // if the color is extremely dark
          resultantColor = getComplementaryGrayscaleColor(color);
        } else {
          resultantColor.l -= 0.1;
        }
      }

      break;
    }
    case NAVIGATION_SETTINGS.COLOR_STYLE.THEME: {
      resultantColor = getComplementaryGrayscaleColor(color);

      break;
    }
  }

  return tinycolor(resultantColor).toHexString();
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
