import { changeAppViewAccessInit } from "actions/applicationActions";
import {
  IconSize,
  TextType,
  Text,
  Switch,
  Case,
  Classes,
  Icon,
  ButtonGroupOption,
  ButtonGroup,
} from "design-system";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsChangingViewAccess,
  getIsFetchingApplications,
} from "selectors/applicationSelectors";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import SwitchWrapper from "../Components/SwitchWrapper";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import DimensionsInput from "pages/Applications/EmbedSnippet/DimensionsInput";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
  MAKE_APPLICATION_PUBLIC_TOOLTIP,
  MAKE_APPLICATION_PUBLIC,
  APP_NAVIGATION_SETTING,
} from "@appsmith/constants/messages";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { ReactComponent as NavOrientationTopIcon } from "assets/icons/settings/nav-orientation-top.svg";
import { ReactComponent as NavOrientationSideIcon } from "assets/icons/settings/nav-orientation-side.svg";
import { ReactComponent as NavPositionStickyIcon } from "assets/icons/settings/nav-position-sticky.svg";
import { ReactComponent as NavPositionStaticIcon } from "assets/icons/settings/nav-position-static.svg";
import { ReactComponent as NavStyleInlineIcon } from "assets/icons/settings/nav-style-inline.svg";
import { ReactComponent as NavStyleStackedIcon } from "assets/icons/settings/nav-style-stacked.svg";
import {
  NavigationSettingsColorStyle,
  NAVIGATION_SETTINGS,
  PublishedNavigationSetting,
  StringsFromPublishedNavigationSetting,
} from "constants/AppConstants";
import _ from "lodash";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

const StyledLink = styled.a`
  position: relative;
  top: 1px;
  :hover {
    text-decoration: none;
  }

  .${Classes.TEXT} {
    border-bottom: 1px solid ${Colors.GRAY_700};
  }
`;

const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

type ButtonGroupSettingProps = {
  heading: string;
  options: ButtonGroupOption[];
  publishedNavigationSetting: StringsFromPublishedNavigationSetting;
  keyName: string;
};

const ButtonGroupSetting = ({
  heading,
  keyName,
  options,
  publishedNavigationSetting,
}: ButtonGroupSettingProps) => {
  const currentValue =
    publishedNavigationSetting?.[
      keyName as keyof StringsFromPublishedNavigationSetting
    ] || "";
  const [selectedValue, setSelectedValue] = useState<string[]>([currentValue]);

  const onChange = (value: string) => {
    setSelectedValue([value]);
  };

  return (
    <div className="pt-4">
      <Text type={TextType.P1}>{heading}</Text>
      <div className="pt-1">
        <ButtonGroup
          fullWidth
          options={options}
          selectButton={onChange}
          values={selectedValue}
        />
      </div>
    </div>
  );
};

const ColorStyleIcon = (props: { style: NavigationSettingsColorStyle }) => {
  const selectedTheme = useSelector(getSelectedAppTheme);

  let backgroundColor = Colors.WHITE;

  if (props.style === NAVIGATION_SETTINGS.COLOR_STYLE.SOLID) {
    backgroundColor =
      selectedTheme?.properties?.colors?.primaryColor || Colors.WHITE;
  } else if (props.style === NAVIGATION_SETTINGS.COLOR_STYLE.DARK) {
    backgroundColor = Colors.GREY_900;
  } else if (props.style === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    backgroundColor = Colors.WHITE;
  }

  return (
    <div
      style={{
        backgroundColor: backgroundColor,
        height: 14,
        width: 14,
        borderRadius: "100%",
        marginRight: 4,
        border: `1px solid ${Colors.GREY_200}`,
      }}
    />
  );
};

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const dispatch = useDispatch();
  const isChangingViewAccess = useSelector(getIsChangingViewAccess);
  const isFetchingApplication = useSelector(getIsFetchingApplications);
  const embedSnippet = useUpdateEmbedSnippet();
  const userAppPermissions = application?.userPermissions ?? [];
  const publishedNavigationSetting: PublishedNavigationSetting = {
    showNavbar: true,
    orientation: "top",
    style: "stacked",
    position: "static",
    itemStyle: "textIcon",
    colorStyle: "light",
    logoConfiguration: "logoApplicationTitle",
    showSignIn: true,
    showShareApp: true,
  };

  return (
    <div className="px-4">
      <div className="pt-4">
        <div className="flex justify-between content-center">
          <StyledPropertyHelpLabel
            label={createMessage(APP_NAVIGATION_SETTING.showNavbarLabel)}
            lineHeight="1.17"
            maxWidth="270px"
          />
          <SwitchWrapper>
            <Switch
              checked={publishedNavigationSetting?.showNavbar}
              className="mb-0"
              disabled={isFetchingApplication || isChangingViewAccess}
              id="t--navigation-settings-show-navbar"
              large
              onChange={() =>
                application &&
                dispatch(
                  changeAppViewAccessInit(
                    application?.id,
                    !publishedNavigationSetting?.showNavbar,
                  ),
                )
              }
            />
          </SwitchWrapper>
        </div>
      </div>

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.orientationLabel)}
        keyName="orientation"
        options={[
          {
            label: _.capitalize(NAVIGATION_SETTINGS.ORIENTATION.TOP),
            value: NAVIGATION_SETTINGS.ORIENTATION.TOP,
            icon: <NavOrientationTopIcon />,
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.ORIENTATION.SIDE),
            value: NAVIGATION_SETTINGS.ORIENTATION.SIDE,
            icon: <NavOrientationSideIcon />,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.styleLabel)}
        keyName="style"
        options={[
          {
            label: _.capitalize(NAVIGATION_SETTINGS.STYLE.STACKED),
            value: NAVIGATION_SETTINGS.STYLE.STACKED,
            icon: <NavStyleStackedIcon />,
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.STYLE.INLINE),
            value: NAVIGATION_SETTINGS.STYLE.INLINE,
            icon: <NavStyleInlineIcon />,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.positionLabel)}
        keyName="position"
        options={[
          {
            label: _.capitalize(NAVIGATION_SETTINGS.POSITION.STATIC),
            value: NAVIGATION_SETTINGS.POSITION.STATIC,
            icon: <NavPositionStaticIcon />,
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.POSITION.STICKY),
            value: NAVIGATION_SETTINGS.POSITION.STICKY,
            icon: <NavPositionStickyIcon />,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.itemStyleLabel)}
        keyName="itemStyle"
        options={[
          {
            label: "Text + Icon",
            value: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT_ICON,
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.ITEM_STYLE.TEXT),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.TEXT,
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.ITEM_STYLE.ICON),
            value: NAVIGATION_SETTINGS.ITEM_STYLE.ICON,
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
      />

      <ButtonGroupSetting
        heading={createMessage(APP_NAVIGATION_SETTING.colorStyleLabel)}
        keyName="colorStyle"
        options={[
          {
            label: _.capitalize(NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
            icon: (
              <ColorStyleIcon style={NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT} />
            ),
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.COLOR_STYLE.SOLID),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.SOLID,
            icon: (
              <ColorStyleIcon style={NAVIGATION_SETTINGS.COLOR_STYLE.SOLID} />
            ),
          },
          {
            label: _.capitalize(NAVIGATION_SETTINGS.COLOR_STYLE.DARK),
            value: NAVIGATION_SETTINGS.COLOR_STYLE.DARK,
            icon: (
              <ColorStyleIcon style={NAVIGATION_SETTINGS.COLOR_STYLE.DARK} />
            ),
          },
        ]}
        publishedNavigationSetting={publishedNavigationSetting}
      />
    </div>
  );
}

export default NavigationSettings;
