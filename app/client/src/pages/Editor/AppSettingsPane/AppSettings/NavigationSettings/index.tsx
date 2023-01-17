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
import { Spinner } from "design-system";

export type UpdateSetting = (
  key: keyof NavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => void;

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const dispatch = useDispatch();
  const navigationSetting = application?.navigationSetting;
  const doesntWorkRightNowLabel = " - [Doesn't work (...right now)]";

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

            payload.navigationSetting = newSettings as NavigationSetting;

            dispatch(updateApplication(applicationId, payload));
          }
        }
      },
      50,
    ),
    [navigationSetting],
  );

  // Show a spinner until default values are set
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
        heading={
          createMessage(APP_NAVIGATION_SETTING.orientationLabel) +
          doesntWorkRightNowLabel
        }
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
        heading={
          createMessage(APP_NAVIGATION_SETTING.navStyleLabel) +
          doesntWorkRightNowLabel
        }
        keyName="navStyle"
        navigationSetting={navigationSetting}
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
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={
          createMessage(APP_NAVIGATION_SETTING.positionLabel) +
          doesntWorkRightNowLabel
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
        updateSetting={updateSetting}
      />

      <LogoConfiguration
        navigationSetting={navigationSetting}
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
