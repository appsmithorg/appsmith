import {
  NavigationSettingsColorStyle,
  NAVIGATION_SETTINGS,
} from "constants/AppConstants";
import { Colors } from "constants/Colors";
import tinycolor from "tinycolor2";

// Menu Item Background Color - Active
export const getMenuItemBackgroundColorWhenActive = (
  color: string,
  navColorStyle: NavigationSettingsColorStyle = NAVIGATION_SETTINGS.COLOR_STYLE
    .LIGHT,
) => {
  const colorHsl = tinycolor(color).toHsl();

  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    colorHsl.l += 0.3;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.SOLID) {
    colorHsl.l -= 0.2;
  }

  return tinycolor(colorHsl).toHexString();
};

// Menu Item Background Color - Hover
export const getMenuItemBackgroundColorOnHover = (
  color: string,
  navColorStyle: NavigationSettingsColorStyle = NAVIGATION_SETTINGS.COLOR_STYLE
    .LIGHT,
) => {
  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    return Colors.GREY_3;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.SOLID) {
    const colorHsl = tinycolor(color).toHsl();

    colorHsl.l += 0.1;

    return tinycolor(colorHsl).toHexString();
  }
};

// Menu Item Text Color - Default, Hover, Active
export const getMenuItemTextColor = (
  color: string,
  navColorStyle: NavigationSettingsColorStyle = NAVIGATION_SETTINGS.COLOR_STYLE
    .LIGHT,
  isDefaultState = false,
) => {
  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    return isDefaultState ? Colors.GREY_9 : color;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.SOLID) {
    const colorHsl = tinycolor(color).toHsl();

    if (colorHsl) {
      return colorHsl.l < 0.5 ? Colors.BLACK : Colors.WHITE;
    } else {
      return Colors.BLACK;
    }
  }
};

// Menu Container Background Color
export const getMenuContainerBackgroundColor = (
  color: string,
  navColorStyle: NavigationSettingsColorStyle = NAVIGATION_SETTINGS.COLOR_STYLE
    .LIGHT,
) => {
  if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    return Colors.WHITE;
  } else if (navColorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.SOLID) {
    return color;
  }
};
