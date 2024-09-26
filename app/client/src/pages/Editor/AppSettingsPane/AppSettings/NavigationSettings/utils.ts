import type {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import { keysOfNavigationSetting } from "constants/AppConstants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { APP_NAVIGATION_SETTING, createMessage } from "ee/constants/messages";
import { toast } from "@appsmith/ads";

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

/**
 * validates the uploaded logo file
 *
 *  checks:
 *  1. file size max 1MB
 *  2. file type - jpg, or png
 *
 * @param e
 * @param callback
 * @returns
 */
export const logoImageValidation = (
  e: React.ChangeEvent<HTMLInputElement>,
  callback?: (e: React.ChangeEvent<HTMLInputElement>) => void,
) => {
  const file = e.target.files?.[0];

  // case 1: no file selected
  if (!file) return false;

  // case 2: file size > 1mb
  if (file.size > 1 * 1024 * 1024) {
    toast.show(createMessage(APP_NAVIGATION_SETTING.logoUploadSizeError), {
      kind: "error",
    });

    return false;
  }

  // case 3: image selected
  const validTypes = ["image/jpeg", "image/png"];

  if (!validTypes.includes(file.type)) {
    toast.show(createMessage(APP_NAVIGATION_SETTING.logoUploadFormatError), {
      kind: "error",
    });

    return false;
  }

  callback && callback(e);
};
