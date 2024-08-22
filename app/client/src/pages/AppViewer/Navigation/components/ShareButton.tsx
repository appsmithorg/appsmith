import React, { useState } from "react";

import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  APPLICATION_INVITE,
  SHARE_APP,
  createMessage,
} from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import type { ApplicationPayload } from "entities/Application";
import { get } from "lodash";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Icon, Tooltip } from "@appsmith/ads";

import Button from "../../AppViewerButton";

interface ShareButtonProps {
  currentApplicationDetails?: ApplicationPayload;
  currentWorkspaceId: string;
  insideSidebar?: boolean;
  isMinimal?: boolean;
}

const ShareButton = (props: ShareButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const {
    currentApplicationDetails,
    currentWorkspaceId,
    insideSidebar,
    isMinimal,
  } = props;

  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;

  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  return (
    <>
      <Tooltip
        content={createMessage(SHARE_APP)}
        isDisabled={insideSidebar}
        placement="bottom"
      >
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className="h-8 t--app-viewer-share-button"
          data-testid="viewmode-share"
          icon={
            <Icon
              color={getApplicationNameTextColor(primaryColor, navColorStyle)}
              name="share-line"
              size="md"
            />
          }
          insideSidebar={insideSidebar}
          isMinimal={isMinimal}
          navColorStyle={navColorStyle}
          onClick={() => setShowModal(true)}
          primaryColor={primaryColor}
          text={insideSidebar && !isMinimal && createMessage(SHARE_APP)}
        />
      </Tooltip>
      {currentWorkspaceId && (
        <FormDialogComponent
          Form={AppInviteUsersForm}
          applicationId={currentApplicationDetails?.id}
          hideDefaultTrigger
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={createMessage(
            APPLICATION_INVITE,
            currentWorkspace?.name,
            !isGACEnabled,
          )}
          workspace={currentWorkspace}
        />
      )}
    </>
  );
};

export default ShareButton;
