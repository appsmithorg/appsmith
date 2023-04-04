import React from "react";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import Button from "../../AppViewerButton";
import { Icon } from "design-system-old";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import { useSelector } from "react-redux";
import { showAppInviteUsersDialogSelector } from "@appsmith/selectors/applicationSelectors";
import {
  createMessage,
  INVITE_USERS_MESSAGE,
  INVITE_USERS_PLACEHOLDER,
  SHARE_APP,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

const { cloudHosting } = getAppsmithConfigs();

type ShareButtonProps = {
  currentApplicationDetails?: ApplicationPayload;
  currentWorkspaceId: string;
  insideSidebar?: boolean;
  isMinimal?: boolean;
};

const ShareButton = (props: ShareButtonProps) => {
  const {
    currentApplicationDetails,
    currentWorkspaceId,
    insideSidebar,
    isMinimal,
  } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );
  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  return (
    <FormDialogComponent
      Form={AppInviteUsersForm}
      applicationId={currentApplicationDetails?.id}
      canOutsideClickClose
      headerIcon={{
        name: "right-arrow",
        bgColor: "transparent",
      }}
      isOpen={showAppInviteUsersDialog}
      message={createMessage(INVITE_USERS_MESSAGE, cloudHosting)}
      placeholder={createMessage(INVITE_USERS_PLACEHOLDER, cloudHosting)}
      title={currentApplicationDetails?.name}
      trigger={
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className="h-8 t--app-viewer-share-button"
          data-cy="viewmode-share"
          icon={
            <Icon
              fillColor={getApplicationNameTextColor(
                primaryColor,
                navColorStyle,
              )}
              name="share-line"
              size="extraLarge"
            />
          }
          insideSidebar={insideSidebar}
          isMinimal={isMinimal}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
          text={insideSidebar && !isMinimal && createMessage(SHARE_APP)}
        />
      }
      workspaceId={currentWorkspaceId}
    />
  );
};

export default ShareButton;
