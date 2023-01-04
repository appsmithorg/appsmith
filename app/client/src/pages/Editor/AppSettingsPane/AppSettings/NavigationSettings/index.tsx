import React, { useEffect, useState } from "react";
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
import _ from "lodash";
import ButtonGroupSetting from "./ButtonGroupSetting";
import ColorStyleIcon from "./ColorStyleIcon";
import LogoConfiguration from "./LogoConfiguration";
import SwitchSetting from "./SwitchSetting";

export type UpdateSetting = (
  key: keyof PublishedNavigationSetting,
  value: PublishedNavigationSetting[keyof PublishedNavigationSetting],
) => void;

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const dispatch = useDispatch();
  const [publishedNavigationSetting, setPublishedNavigationSetting] = useState<
    PublishedNavigationSetting
  >({} as PublishedNavigationSetting);

  useEffect(() => {
    const defaultNavConfig = {
      showNavbar: true,
      orientation: NAVIGATION_SETTINGS.ORIENTATION.TOP,
      style: NAVIGATION_SETTINGS.STYLE.STACKED,
      position: NAVIGATION_SETTINGS.POSITION.STATIC,
      itemStyle: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON,
      colorStyle: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      logoConfiguration:
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
      showSignIn: true,
      showShareApp: true,
    };

    setPublishedNavigationSetting(defaultNavConfig);
  }, []);

  const updateSetting = (
    key: keyof PublishedNavigationSetting,
    value: PublishedNavigationSetting[keyof PublishedNavigationSetting],
  ) => {
    const newSettings: PublishedNavigationSetting = {
      ...publishedNavigationSetting,
      [key]: value,
    };

    setPublishedNavigationSetting(newSettings);
  };

  return (
    <div className="px-4">
      <SwitchSetting
        keyName="showNavbar"
        label={createMessage(APP_NAVIGATION_SETTING.showNavbarLabel)}
        updateSetting={updateSetting}
        value={publishedNavigationSetting?.showNavbar}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.orientationLabel)}
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
        heading={createMessage(APP_NAVIGATION_SETTING.styleLabel)}
        keyName="style"
        options={[
          {
            label: _.startCase(NAVIGATION_SETTINGS.STYLE.STACKED),
            value: NAVIGATION_SETTINGS.STYLE.STACKED,
            icon: <NavStyleStackedIcon />,
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.STYLE.INLINE),
            value: NAVIGATION_SETTINGS.STYLE.INLINE,
            icon: <NavStyleInlineIcon />,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
        updateSetting={updateSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.positionLabel)}
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
              <ColorStyleIcon style={NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT} />
            ),
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.SOLID),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.SOLID,
            icon: (
              <ColorStyleIcon style={NAVIGATION_SETTINGS.COLOR_STYLE.SOLID} />
            ),
          },
          {
            label: _.startCase(NAVIGATION_SETTINGS.COLOR_STYLE.DARK),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.DARK,
            icon: (
              <ColorStyleIcon style={NAVIGATION_SETTINGS.COLOR_STYLE.DARK} />
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
