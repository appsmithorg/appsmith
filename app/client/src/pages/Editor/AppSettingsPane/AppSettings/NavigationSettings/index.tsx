import React, { useCallback, useEffect } from "react";
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
import {
  NAVIGATION_SETTINGS,
  PublishedNavigationSetting,
} from "constants/AppConstants";
import _, { debounce, isEmpty, isPlainObject } from "lodash";
import ButtonGroupSetting from "./ButtonGroupSetting";
import ColorStyleIcon from "./ColorStyleIcon";
import LogoConfiguration from "./LogoConfiguration";
import SwitchSetting from "./SwitchSetting";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import equal from "fast-deep-equal";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "actions/applicationActions";
import { Spinner } from "design-system";

export type UpdateSetting = (
  key: keyof PublishedNavigationSetting,
  value: PublishedNavigationSetting[keyof PublishedNavigationSetting],
) => void;

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const dispatch = useDispatch();
  const publishedNavigationSetting = application?.publishedNavigationSetting;
  const defaultSettings = {
    showNavbar: true,
    orientation: NAVIGATION_SETTINGS.ORIENTATION.TOP,
    navStyle: NAVIGATION_SETTINGS.NAV_STYLE.STACKED,
    position: NAVIGATION_SETTINGS.POSITION.STATIC,
    itemStyle: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON,
    colorStyle: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
    logoConfiguration:
      NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
    showSignIn: true,
    showShareApp: true,
  };
  const doesntWorkRightNowLabel = " - [Doesn't work (...right now)]";

  useEffect(() => {
    // Set default values
    if (!publishedNavigationSetting) {
      const payload: UpdateApplicationPayload = { currentApp: true };

      payload.publishedNavigationSetting = defaultSettings;

      dispatch(updateApplication(applicationId, payload));
    }
  }, [publishedNavigationSetting]);

  const updateSetting = useCallback(
    debounce(
      (
        key: keyof PublishedNavigationSetting,
        value: PublishedNavigationSetting[keyof PublishedNavigationSetting],
      ) => {
        if (
          publishedNavigationSetting &&
          isPlainObject(publishedNavigationSetting) &&
          !isEmpty(publishedNavigationSetting)
        ) {
          const newSettings = {
            ...publishedNavigationSetting,
            [key]: value,
          };

          if (!equal(publishedNavigationSetting, newSettings)) {
            const payload: UpdateApplicationPayload = { currentApp: true };

            payload.publishedNavigationSetting = newSettings as PublishedNavigationSetting;

            dispatch(updateApplication(applicationId, payload));
          }
        }
      },
      50,
    ),
    [publishedNavigationSetting],
  );

  // Show a spinner until default values are set
  if (!publishedNavigationSetting) {
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
        value={publishedNavigationSetting?.showNavbar}
      />

      <ButtonGroupSetting
        heading={
          createMessage(APP_NAVIGATION_SETTING.orientationLabel) +
          doesntWorkRightNowLabel
        }
        keyName="orientation"
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
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={
          createMessage(APP_NAVIGATION_SETTING.navStyleLabel) +
          doesntWorkRightNowLabel
        }
        keyName="navStyle"
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.STACKED),
            value: NAVIGATION_SETTINGS.NAV_STYLE.STACKED,
            icon: <NavStyleStackedIcon />,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.NAV_STYLE.INLINE),
            value: NAVIGATION_SETTINGS.NAV_STYLE.INLINE,
            icon: <NavStyleInlineIcon />,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={
          createMessage(APP_NAVIGATION_SETTING.positionLabel) +
          doesntWorkRightNowLabel
        }
        keyName="position"
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
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.itemStyleLabel)}
        keyName="itemStyle"
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.ITEM_STYLE.TEXT),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.ITEM_STYLE.ICON),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.ICON,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.colorStyleLabel)}
        keyName="colorStyle"
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
            label: _.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.SOLID),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.SOLID,
            icon: (
              <ColorStyleIcon
                colorStyle={NAVIGATION_SETTINGS.COLOR_STYLE.SOLID}
              />
            ),
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.DARK),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.DARK,
            icon: (
              <ColorStyleIcon
                colorStyle={NAVIGATION_SETTINGS.COLOR_STYLE.DARK}
              />
            ),
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <LogoConfiguration
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <SwitchSetting
        keyName="showSignIn"
        label={createMessage(APP_NAVIGATION_SETTING.showSignInLabel)}
        updateSetting={updateSetting}
        value={publishedNavigationSetting?.showSignIn}
      />

      <SwitchSetting
        keyName="showShareApp"
        label={createMessage(APP_NAVIGATION_SETTING.showShareAppLabel)}
        updateSetting={updateSetting}
        value={publishedNavigationSetting?.showShareApp}
      />
    </div>
  );
}

export default NavigationSettings;
