import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import {
  createMessage,
  APP_NAVIGATION_SETTING,
} from "@appsmith/constants/messages";
// import { ReactComponent as NavOrientationTopIcon } from "assets/icons/settings/nav-orientation-top.svg";
// import { ReactComponent as NavOrientationSideIcon } from "assets/icons/settings/nav-orientation-side.svg";
// import { ReactComponent as NavStyleInlineIcon } from "assets/icons/settings/nav-style-inline.svg";
// import { ReactComponent as NavStyleStackedIcon } from "assets/icons/settings/nav-style-stacked.svg";
// import { ReactComponent as NavStyleSidebarIcon } from "assets/icons/settings/nav-style-sidebar.svg";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import _, { debounce, isEmpty, isPlainObject } from "lodash";
import ButtonGroupSetting from "./ButtonGroupSetting";
import ColorStyleIcon from "./ColorStyleIcon";
import SwitchSetting from "./SwitchSetting";
import type { UpdateApplicationPayload } from "@appsmith/api/ApplicationApi";
import equal from "fast-deep-equal";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "@appsmith/actions/applicationActions";
import { Spinner } from "design-system-old";

/**
 * TODO - @Dhruvik - ImprovedAppNav
 * Revisit these imports in v1.1
 * https://www.notion.so/appsmith/Ship-Faster-33b32ed5b6334810a0b4f42e03db4a5b?pvs=4
 */
// import LogoConfiguration from "./LogoConfiguration";
// import { ReactComponent as NavPositionStickyIcon } from "assets/icons/settings/nav-position-sticky.svg";
// import { ReactComponent as NavPositionStaticIcon } from "assets/icons/settings/nav-position-static.svg";
// import { ReactComponent as NavStyleMinimalIcon } from "assets/icons/settings/nav-style-minimal.svg";

export type UpdateSetting = (
  key: keyof NavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => void;

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const dispatch = useDispatch();
  const [navigationSetting, setNavigationSetting] = useState(
    application?.applicationDetail?.navigationSetting,
  );

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
            const payload: UpdateApplicationPayload = {
              currentApp: true,
            };

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
             * TODO - @Dhruvik - ImprovedAppNav
             * Uncomment to change these settings automatically in v1.1
             * https://www.notion.so/appsmith/Ship-Faster-33b32ed5b6334810a0b4f42e03db4a5b
             *
             * When the orientation is side and nav style changes -
             * 1. to minimal, change the item style to icon
             * 1. to sidebar, change the item style to text + icon
             */
            // if (
            //   newSettings.orientation ===
            //     NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
            //   navigationSetting.navStyle !== newSettings.navStyle
            // ) {
            //   if (
            //     newSettings.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL
            //   ) {
            //     newSettings.itemStyle = NAVIGATION_SETTINGS.ITEM_STYLE.ICON;
            //   } else if (
            //     newSettings.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR
            //   ) {
            //     newSettings.itemStyle =
            //       NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON;
            //   }
            // }

            if (payload.applicationDetail) {
              payload.applicationDetail.navigationSetting =
                newSettings as NavigationSetting;
            } else {
              payload.applicationDetail = {
                navigationSetting: newSettings as NavigationSetting,
              };
            }

            dispatch(updateApplication(applicationId, payload));
            setNavigationSetting(newSettings);
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

      {navigationSetting?.showNavbar && (
        <>
          <ButtonGroupSetting
            heading={createMessage(APP_NAVIGATION_SETTING.orientationLabel)}
            keyName="orientation"
            navigationSetting={navigationSetting}
            options={[
              {
                label: _.startCase(NAVIGATION_SETTINGS.ORIENTATION.TOP),
                value: NAVIGATION_SETTINGS.ORIENTATION.TOP,
                // icon: <NavOrientationTopIcon />,
              },
              {
                label: _.startCase(NAVIGATION_SETTINGS.ORIENTATION.SIDE),
                value: NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                // icon: <NavOrientationSideIcon />,
              },
            ]}
            updateSetting={updateSetting}
          />

          {/**
           * TODO - @Dhruvik - ImprovedAppNav
           * Remove check for orientation = top in v1.1
           * https://www.notion.so/appsmith/Ship-Faster-33b32ed5b6334810a0b4f42e03db4a5b
           */}
          {navigationSetting?.orientation ===
            NAVIGATION_SETTINGS.ORIENTATION.TOP && (
            <ButtonGroupSetting
              heading={createMessage(APP_NAVIGATION_SETTING.navStyleLabel)}
              keyName="navStyle"
              navigationSetting={navigationSetting}
              options={[
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.STACKED),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.STACKED,
                  // icon: <NavStyleStackedIcon />,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                },
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.INLINE),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.INLINE,
                  // icon: <NavStyleInlineIcon />,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                },
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR,
                  // icon: <NavStyleSidebarIcon />,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.TOP,
                },
                /**
                 * TODO - @Dhruvik - ImprovedAppNav
                 * Hiding minimal sidebar for v1
                 * https://www.notion.so/appsmith/Ship-Faster-33b32ed5b6334810a0b4f42e03db4a5b
                 */
                // {
                //   label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL),
                //   value: NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL,
                //   icon: <NavStyleMinimalIcon />,
                //   hidden:
                //     navigationSetting?.orientation ===
                //     NAVIGATION_SETTINGS.ORIENTATION.TOP,
                // },
              ]}
              updateSetting={updateSetting}
            />
          )}

          {/**
           * TODO - @Dhruvik - ImprovedAppNav
           * Hiding position for v1
           * https://www.notion.so/appsmith/Logo-configuration-option-can-be-multiselect-2a436598539c4db99d1f030850fd8918?pvs=4
           */}
          {/* <ButtonGroupSetting
            heading={createMessage(APP_NAVIGATION_SETTING.positionLabel)}
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
          /> */}

          {/**
           * TODO - @Dhruvik - ImprovedAppNav
           * Hiding item style for v1
           * https://www.notion.so/appsmith/Logo-configuration-option-can-be-multiselect-2a436598539c4db99d1f030850fd8918?pvs=4
           */}
          {/* <ButtonGroupSetting
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
          /> */}

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

          {/**
           * TODO - @Dhruvik - ImprovedAppNav
           * Hiding logo config for v1
           * https://www.notion.so/appsmith/Logo-configuration-option-can-be-multiselect-2a436598539c4db99d1f030850fd8918?pvs=4
           */}
          {/* <LogoConfiguration
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
          /> */}

          <SwitchSetting
            keyName="showSignIn"
            label={createMessage(APP_NAVIGATION_SETTING.showSignInLabel)}
            tooltip={createMessage(APP_NAVIGATION_SETTING.showSignInTooltip)}
            updateSetting={updateSetting}
            value={navigationSetting?.showSignIn}
          />
        </>
      )}
    </div>
  );
}

export default NavigationSettings;
