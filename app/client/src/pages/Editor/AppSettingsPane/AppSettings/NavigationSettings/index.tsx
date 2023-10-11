import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import {
  APP_NAVIGATION_SETTING,
  createMessage,
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
import { Spinner } from "design-system";
import LogoInput from "pages/Editor/NavigationSettings/LogoInput";
import SwitchSettingForLogoConfiguration from "./SwitchSettingForLogoConfiguration";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

/**
 * TODO - @Dhruvik - ImprovedAppNav
 * Revisit these imports in v1.1
 * https://www.notion.so/appsmith/Ship-Faster-33b32ed5b6334810a0b4f42e03db4a5b?pvs=4
 */
// import { ReactComponent as NavPositionStickyIcon } from "assets/icons/settings/nav-position-sticky.svg";
// import { ReactComponent as NavPositionStaticIcon } from "assets/icons/settings/nav-position-static.svg";
// import { ReactComponent as NavStyleMinimalIcon } from "assets/icons/settings/nav-style-minimal.svg";

export type UpdateSetting = (
  key: keyof NavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => void;

export interface LogoConfigurationSwitches {
  logo: boolean;
  applicationTitle: boolean;
}

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const featureFlags = useSelector(selectFeatureFlags);
  const dispatch = useDispatch();
  const [navigationSetting, setNavigationSetting] = useState(
    application?.applicationDetail?.navigationSetting,
  );
  const [logoConfigurationSwitches, setLogoConfigurationSwitches] =
    useState<LogoConfigurationSwitches>({
      logo: false,
      applicationTitle: false,
    });

  useEffect(() => {
    setNavigationSetting(application?.applicationDetail?.navigationSetting);

    // Logo configuration
    switch (navigationSetting?.logoConfiguration) {
      case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY:
        setLogoConfigurationSwitches({
          logo: false,
          applicationTitle: true,
        });
        break;
      case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE:
        setLogoConfigurationSwitches({
          logo: true,
          applicationTitle: true,
        });
        break;
      case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY:
        setLogoConfigurationSwitches({
          logo: true,
          applicationTitle: false,
        });
        break;
      case NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE:
        setLogoConfigurationSwitches({
          logo: false,
          applicationTitle: false,
        });
        break;
      default:
        break;
    }
  }, [application?.applicationDetail?.navigationSetting]);

  useEffect(() => {
    if (
      logoConfigurationSwitches.logo &&
      logoConfigurationSwitches.applicationTitle
    ) {
      updateSetting(
        "logoConfiguration",
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
      );
    } else if (
      logoConfigurationSwitches.logo &&
      !logoConfigurationSwitches.applicationTitle
    ) {
      updateSetting(
        "logoConfiguration",
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY,
      );
    } else if (
      !logoConfigurationSwitches.logo &&
      logoConfigurationSwitches.applicationTitle
    ) {
      updateSetting(
        "logoConfiguration",
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
      );
    } else if (
      !logoConfigurationSwitches.logo &&
      !logoConfigurationSwitches.applicationTitle
    ) {
      updateSetting(
        "logoConfiguration",
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE,
      );
    }
  }, [logoConfigurationSwitches]);

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
          const newSettings: NavigationSetting = {
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

            payload.applicationDetail = {
              navigationSetting: newSettings,
            };

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
        <Spinner size="lg" />
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
                // startIcon:<NavOrientationTopIcon />,
              },
              {
                label: _.startCase(NAVIGATION_SETTINGS.ORIENTATION.SIDE),
                value: NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                // startIcon:<NavOrientationSideIcon />,
              },
            ]}
            updateSetting={updateSetting}
          />

          {/**
           * TODO - @Dhruvik - ImprovedAppNav
           * Remove check for orientation = top when adding sidebar minimal to show sidebar
           * variants as well.
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
                  // startIcon:<NavStyleStackedIcon />,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                },
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.INLINE),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.INLINE,
                  // startIcon:<NavStyleInlineIcon />,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                },
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR,
                  // startIcon:<NavStyleSidebarIcon />,
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
                //   startIcon:<NavStyleMinimalIcon />,
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
                startIcon:<NavPositionStaticIcon />,
              },
              {
                label: _.startCase(NAVIGATION_SETTINGS.POSITION.STICKY),
                value: NAVIGATION_SETTINGS.POSITION.STICKY,
                startIcon:<NavPositionStickyIcon />,
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
                value: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
                label: (
                  <div className="flex items-center">
                    <ColorStyleIcon
                      colorStyle={NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT}
                    />
                    <span>
                      {_.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT)}
                    </span>
                  </div>
                ),
              },
              {
                value: NAVIGATION_SETTINGS.COLOR_STYLE.THEME,
                label: (
                  <div className="flex items-center">
                    <ColorStyleIcon
                      colorStyle={NAVIGATION_SETTINGS.COLOR_STYLE.THEME}
                    />
                    <span>
                      {_.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.THEME)}
                    </span>
                  </div>
                ),
              },
            ]}
            updateSetting={updateSetting}
          />

          {(navigationSetting?.logoAssetId ||
            featureFlags.release_appnavigationlogoupload_enabled) && (
            <>
              <SwitchSettingForLogoConfiguration
                keyName="logo"
                label={createMessage(APP_NAVIGATION_SETTING.showLogoLabel)}
                logoConfigurationSwitches={logoConfigurationSwitches}
                setLogoConfigurationSwitches={setLogoConfigurationSwitches}
              />

              {(navigationSetting?.logoConfiguration ===
                NAVIGATION_SETTINGS.LOGO_CONFIGURATION
                  .LOGO_AND_APPLICATION_TITLE ||
                navigationSetting?.logoConfiguration ===
                  NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY) && (
                <LogoInput
                  navigationSetting={navigationSetting}
                  updateSetting={updateSetting}
                />
              )}
            </>
          )}

          <SwitchSettingForLogoConfiguration
            keyName="applicationTitle"
            label={createMessage(
              APP_NAVIGATION_SETTING.showApplicationTitleLabel,
            )}
            logoConfigurationSwitches={logoConfigurationSwitches}
            setLogoConfigurationSwitches={setLogoConfigurationSwitches}
          />

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
