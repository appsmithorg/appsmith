import type {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import { keysOfNavigationSetting } from "constants/AppConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";

export const logEvent = (
  keyName: keyof StringsFromNavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => {
  switch (keyName) {
    case keysOfNavigationSetting.showNavbar:
      AnalyticsUtil.logEvent("APP_NAVIGATION_SHOW_NAV", {
        show: value,
      });
      break;
    case keysOfNavigationSetting.orientation:
      AnalyticsUtil.logEvent("APP_NAVIGATION_ORIENTATION", {
        orientation: value,
      });
      break;
    case keysOfNavigationSetting.navStyle:
      AnalyticsUtil.logEvent("APP_NAVIGATION_VARIANT", {
        variant: value,
      });
      break;
    case keysOfNavigationSetting.colorStyle:
      AnalyticsUtil.logEvent("APP_NAVIGATION_BACKGROUND_COLOR", {
        background_color: value,
      });
      break;
    case keysOfNavigationSetting.showSignIn:
      AnalyticsUtil.logEvent("APP_NAVIGATION_SHOW_SIGN_IN", {
        show_sign_in: value,
      });
      break;
    default:
      break;
  }
};
