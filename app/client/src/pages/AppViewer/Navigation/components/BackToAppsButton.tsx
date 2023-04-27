import React from "react";
import Button from "../../AppViewerButton";
import { useSelector } from "react-redux";
import { ALL_APPS, createMessage } from "@appsmith/constants/messages";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getMenuItemTextColor } from "pages/AppViewer/utils";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { useHistory } from "react-router";
import styled from "styled-components";
import AppsLineIcon from "remixicon-react/AppsLineIcon";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { TooltipComponent } from "design-system-old";

type BackToAppsButtonProps = {
  currentApplicationDetails?: ApplicationPayload;
  insideSidebar?: boolean;
  isMinimal?: boolean;
};

const StyledAppIcon = styled(AppsLineIcon)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  borderRadius: string;
  insideSidebar?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
  width: 16px;
  height: 16px;
`;

const BackToAppsButton = (props: BackToAppsButtonProps) => {
  const { currentApplicationDetails, insideSidebar, isMinimal } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const history = useHistory();
  const currentUser: User | undefined = useSelector(getCurrentUser);

  if (currentUser?.username === ANONYMOUS_USERNAME) {
    return <span />;
  }

  return (
    <TooltipComponent
      boundary="viewport"
      content={createMessage(ALL_APPS)}
      disabled={insideSidebar}
      hoverOpenDelay={500}
      modifiers={{
        preventOverflow: {
          enabled: true,
          boundariesElement: "viewport",
        },
      }}
      position="bottom"
    >
      <Button
        borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
        className="h-8 t--app-viewer-back-to-apps-button"
        icon={
          <StyledAppIcon
            borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
            insideSidebar={insideSidebar}
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
        }
        insideSidebar={insideSidebar}
        isMinimal={isMinimal}
        navColorStyle={navColorStyle}
        onClick={() => {
          history.push("/applications");
        }}
        primaryColor={primaryColor}
        text={insideSidebar && !isMinimal && createMessage(ALL_APPS)}
      />
    </TooltipComponent>
  );
};

export default BackToAppsButton;
