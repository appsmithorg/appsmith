import type {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import {
  keysOfNavigationSetting,
  NAVIGATION_SETTINGS,
} from "constants/AppConstants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { APP_NAVIGATION_SETTING, createMessage } from "ee/constants/messages";
import { toast } from "@appsmith/ads";
import type { LogoConfigurationSwitches } from "../../types";

export const getLogoConfigurationSwitches = (
  logoConfiguration?: NavigationSetting["logoConfiguration"],
): LogoConfigurationSwitches => {
  switch (logoConfiguration) {
    case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY:
      return { logo: false, applicationTitle: true };
    case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE:
      return { logo: true, applicationTitle: true };
    case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY:
      return { logo: true, applicationTitle: false };
    case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE:
      return { logo: false, applicationTitle: false };
    default:
      return { logo: false, applicationTitle: false };
  }
};

export const getNextLogoConfiguration = (
  current: NavigationSetting["logoConfiguration"] | undefined,
  key: keyof LogoConfigurationSwitches,
): NavigationSetting["logoConfiguration"] => {
  const switches = getLogoConfigurationSwitches(current);
  const next = {
    ...switches,
    [key]: !switches[key],
  };

  if (next.logo && next.applicationTitle) {
    return NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE;
  }

  if (next.logo && !next.applicationTitle) {
    return NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY;
  }

  if (!next.logo && next.applicationTitle) {
    return NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY;
  }

  return NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE;
};

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
    case keysOfNavigationSetting.showShareApp:
      AnalyticsUtil.logEvent("APP_NAVIGATION_SHOW_SHARE_APP", {
        show_share_app: value,
      });
      break;
    case keysOfNavigationSetting.showAllApps:
      AnalyticsUtil.logEvent("APP_NAVIGATION_SHOW_ALL_APPS", {
        show_all_apps: value,
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
