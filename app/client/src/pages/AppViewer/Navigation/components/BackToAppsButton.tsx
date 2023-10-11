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
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Tooltip } from "design-system";
import { importRemixIcon } from "design-system-old";

const AppsLineIcon = importRemixIcon(
  async () => import("remixicon-react/AppsLineIcon"),
);

interface BackToAppsButtonProps {
  currentApplicationDetails?: ApplicationPayload;
  insideSidebar?: boolean;
  isMinimal?: boolean;
}

const StyledAppIcon = styled(AppsLineIcon)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
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
    return null;
  }
  return (
    <Tooltip
      content={createMessage(ALL_APPS)}
      isDisabled={insideSidebar}
      mouseEnterDelay={0.5}
    >
      <Button
        borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
        className="h-8 t--app-viewer-back-to-apps-button"
        icon={
          <StyledAppIcon
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
    </Tooltip>
  );
};

export default BackToAppsButton;
