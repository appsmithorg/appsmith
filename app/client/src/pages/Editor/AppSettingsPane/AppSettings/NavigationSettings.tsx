import { changeAppViewAccessInit } from "actions/applicationActions";
import {
  IconSize,
  TextType,
  Text,
  Switch,
  Case,
  Classes,
  Icon,
  ButtonTab,
} from "design-system";
import React from "react";
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
import { ReactComponent as NavStyleInlineIcon } from "assets/icons/settings/nav-style-inline.svg";
import { ReactComponent as NavStyleStackedIcon } from "assets/icons/settings/nav-style-stacked.svg";

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

function NavigationSettings() {
  const application = useSelector(getCurrentApplication);
  const dispatch = useDispatch();
  const isChangingViewAccess = useSelector(getIsChangingViewAccess);
  const isFetchingApplication = useSelector(getIsFetchingApplications);
  const embedSnippet = useUpdateEmbedSnippet();
  const userAppPermissions = application?.userPermissions ?? [];
  const publishedNavigationSetting = {
    showNavbar: true,
    orientation: "top",
    navStyle: "stacked",
    position: "static",
    itemStyle: "textIcon",
    colorStyle: "light",
    logoConfiguration: "logoApplicationTitle",
    showSignIn: true,
    showShareApp: true,
  };

  return (
    <div>
      <div className="py-4 px-4">
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

      <div className="px-4">
        <Text type={TextType.P1}>
          {createMessage(APP_NAVIGATION_SETTING.orientationLabel)}
        </Text>
        <div className="pt-1 pb-4">
          <ButtonTab
            fullWidth
            options={[
              {
                label: "Top",
                value: "top",
                icon: <NavOrientationTopIcon />,
              },
              {
                label: "Side",
                value: "side",
                icon: <NavOrientationSideIcon />,
              },
            ]}
            selectButton={() => {
              return;
            }}
            values={
              publishedNavigationSetting?.orientation
                ? [publishedNavigationSetting?.orientation]
                : []
            }
          />
        </div>
      </div>
    </div>
  );
}

export default NavigationSettings;
