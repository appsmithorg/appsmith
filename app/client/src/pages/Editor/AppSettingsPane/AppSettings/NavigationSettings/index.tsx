import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  createMessage,
  APP_NAVIGATION_SETTING,
} from "@appsmith/constants/messages";
import { ReactComponent as NavOrientationTopIcon } from "assets/icons/settings/nav-orientation-top.svg";
import { ReactComponent as NavOrientationSideIcon } from "assets/icons/settings/nav-orientation-side.svg";
import { ReactComponent as NavPositionStickyIcon } from "assets/icons/settings/nav-position-sticky.svg";
import { ReactComponent as NavPositionStaticIcon } from "assets/icons/settings/nav-position-static.svg";
import { ReactComponent as NavStyleInlineIcon } from "assets/icons/settings/nav-style-inline.svg";
import { ReactComponent as NavStyleStackedIcon } from "assets/icons/settings/nav-style-stacked.svg";
import { ReactComponent as NavStyleSidebarIcon } from "assets/icons/settings/nav-style-sidebar.svg";
import { ReactComponent as NavStyleMinimalIcon } from "assets/icons/settings/nav-style-minimal.svg";
import { NAVIGATION_SETTINGS, NavigationSetting } from "constants/AppConstants";
import _, { debounce, isEmpty, isPlainObject } from "lodash";
import ButtonGroupSetting from "./ButtonGroupSetting";
import ColorStyleIcon from "./ColorStyleIcon";
import LogoConfiguration from "./LogoConfiguration";
import SwitchSetting from "./SwitchSetting";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import equal from "fast-deep-equal";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "actions/applicationActions";
import { Spinner } from "design-system-old";

export type UpdateSetting = (
  key: keyof NavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => void;

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const dispatch = useDispatch();
  const navigationSetting = application?.navigationSetting;

  const updateSetting = useCallback(
    debounce(
      (
        key: keyof NavigationSetting,
        value: NavigationSetting[keyof NavigationSetting],
      ) => {
        if (
          navigationSetting &&
          isPlainObject(navigationSetting) &&
          !isEmpty(navigationSetting)
        ) {
          const newSettings = {
            ...navigationSetting,
            [key]: value,
          };

          if (!equal(navigationSetting, newSettings)) {
            const payload: UpdateApplicationPayload = { currentApp: true };

            /**
             * If the orientation changes, we need to set a new default value
             * 1. in case of top, the default is stacked
             * 2. in case of side, the default is sidebar
             */
            if (navigationSetting.orientation !== newSettings.orientation) {
              newSettings.navStyle =
                newSettings.orientation === NAVIGATION_SETTINGS.ORIENTATION.TOP
                  ? NAVIGATION_SETTINGS.NAV_STYLE.STACKED
                  : NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR;
            }

            /**
             * When the orientation is side and nav style changes -
             * 1. to minimal, change the item style to icon
             * 1. to sidebar, change the item style to text + icon
             */
            if (
              newSettings.orientation ===
                NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
              navigationSetting.navStyle !== newSettings.navStyle
            ) {
              if (
                newSettings.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL
              ) {
                newSettings.itemStyle = NAVIGATION_SETTINGS.ITEM_STYLE.ICON;
              } else if (
                newSettings.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR
              ) {
                newSettings.itemStyle =
                  NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON;
              }
            }

            payload.navigationSetting = newSettings as NavigationSetting;

            dispatch(updateApplication(applicationId, payload));
          }
        }
      },
      50,
    ),
    [navigationSetting],
  );

  if (!navigationSetting) {
    return (
      <div className="px-4 py-10 w-full flex justify-center">
        <Spinner size="extraExtraExtraExtraLarge" />
      </div>
    );
  }

  return (
    <div className="px-4">
      <SwitchSetting
        keyName="showNavbar"
        label={createMessage(APP_NAVIGATION_SETTING.showNavbarLabel)}
        updateSetting={updateSetting}
        value={navigationSetting?.showNavbar}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.orientationLabel)}
        keyName="orientation"
        navigationSetting={navigationSetting}
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.ORIENTATION.TOP),
            value: NAVIGATION_SETTINGS.ORIENTATION.TOP,
            icon: <NavOrientationTopIcon />,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.ORIENTATION.SIDE),
            value: NAVIGATION_SETTINGS.ORIENTATION.SIDE,
            icon: <NavOrientationSideIcon />,
          },
        ]}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.navStyleLabel)}
        keyName="navStyle"
        navigationSetting={navigationSetting}
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.STACKED),
            value: NAVIGATION_SETTINGS.NAV_STYLE.STACKED,
            icon: <NavStyleStackedIcon />,
            hidden:
              navigationSetting?.orientation ===
              NAVIGATION_SETTINGS.ORIENTATION.SIDE,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.INLINE),
            value: NAVIGATION_SETTINGS.NAV_STYLE.INLINE,
            icon: <NavStyleInlineIcon />,
            hidden:
              navigationSetting?.orientation ===
              NAVIGATION_SETTINGS.ORIENTATION.SIDE,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR),
            value: NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR,
            icon: <NavStyleSidebarIcon />,
            hidden:
              navigationSetting?.orientation ===
              NAVIGATION_SETTINGS.ORIENTATION.TOP,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL),
            value: NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL,
            icon: <NavStyleMinimalIcon />,
            hidden:
              navigationSetting?.orientation ===
              NAVIGATION_SETTINGS.ORIENTATION.TOP,
          },
        ]}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={
          createMessage(APP_NAVIGATION_SETTING.positionLabel) +
          " - [Unavailable atm]"
        }
        keyName="position"
        navigationSetting={navigationSetting}
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.POSITION.STATIC),
            value: NAVIGATION_SETTINGS.POSITION.STATIC,
            icon: <NavPositionStaticIcon />,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.POSITION.STICKY),
            value: NAVIGATION_SETTINGS.POSITION.STICKY,
            icon: <NavPositionStickyIcon />,
          },
        ]}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.itemStyleLabel)}
        keyName="itemStyle"
        navigationSetting={navigationSetting}
        options={[
          {
            label: "Text + Icon",
            value: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON,
            hidden:
              navigationSetting?.navStyle ===
              NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.ITEM_STYLE.TEXT),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT,
            hidden:
              navigationSetting?.navStyle ===
              NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.ITEM_STYLE.ICON),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.ICON,
            hidden:
              navigationSetting?.orientation ===
                NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
              navigationSetting?.navStyle ===
                NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR,
          },
        ]}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.colorStyleLabel)}
        keyName="colorStyle"
        navigationSetting={navigationSetting}
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
            icon: (
              <ColorStyleIcon
                colorStyle={NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT}
              />
            ),
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.THEME),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.THEME,
            icon: (
              <ColorStyleIcon
                colorStyle={NAVIGATION_SETTINGS.COLOR_STYLE.THEME}
              />
            ),
          },
        ]}
        updateSetting={updateSetting}
      />

      <LogoConfiguration
        navigationSetting={navigationSetting}
        options={[
          {
            label: _.startCase(
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
            ),
            value:
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
          },
          {
            label: _.startCase(
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY,
            ),
            value: NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY,
          },
          {
            label: _.startCase(
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
            ),
            value:
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
          },
          {
            label: _.startCase(
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION
                .NO_LOGO_OR_APPLICATION_TITLE,
            ),
            value:
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION
                .NO_LOGO_OR_APPLICATION_TITLE,
          },
        ]}
        updateSetting={updateSetting}
      />

      <SwitchSetting
        keyName="showSignIn"
        label={createMessage(APP_NAVIGATION_SETTING.showSignInLabel)}
        updateSetting={updateSetting}
        value={navigationSetting?.showSignIn}
      />

      <SwitchSetting
        keyName="showShareApp"
        label={createMessage(APP_NAVIGATION_SETTING.showShareAppLabel)}
        updateSetting={updateSetting}
        value={navigationSetting?.showShareApp}
      />
    </div>
  );
}

export default NavigationSettings;
