import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { APP_NAVIGATION_SETTING, createMessage } from "ee/constants/messages";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import _, { debounce, isEmpty, isPlainObject } from "lodash";
import ButtonGroupSetting from "./ButtonGroupSetting";
import ColorStyleIcon from "./ColorStyleIcon";
import SwitchSetting from "./SwitchSetting";
import type { UpdateApplicationPayload } from "ee/api/ApplicationApi";
import equal from "fast-deep-equal";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "ee/actions/applicationActions";
import { Spinner } from "@appsmith/ads";
import LogoInput from "./LogoInput";
import SwitchSettingForLogoConfiguration from "./SwitchSettingForLogoConfiguration";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import type { LogoConfigurationSwitches } from "../../types";

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
              },
              {
                label: _.startCase(NAVIGATION_SETTINGS.ORIENTATION.SIDE),
                value: NAVIGATION_SETTINGS.ORIENTATION.SIDE,
              },
            ]}
            updateSetting={updateSetting}
          />

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
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                },
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.INLINE),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.INLINE,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.SIDE,
                },
                {
                  label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR),
                  value: NAVIGATION_SETTINGS.NAV_STYLE.SIDEBAR,
                  hidden:
                    navigationSetting?.orientation ===
                    NAVIGATION_SETTINGS.ORIENTATION.TOP,
                },
              ]}
              updateSetting={updateSetting}
            />
          )}

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
