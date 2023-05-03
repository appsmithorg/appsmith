import React, { useState } from "react";
import Button from "../../AppViewerButton";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import { useSelector } from "react-redux";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getApplicationNameTextColor } from "pages/AppViewer/utils";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import {
  createMessage,
  INVITE_USERS_PLACEHOLDER,
  SHARE_APP,
} from "@appsmith/constants/messages";
import {
  Icon,
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
} from "design-system";

const { cloudHosting } = getAppsmithConfigs();

type ShareButtonProps = {
  currentApplicationDetails?: ApplicationPayload;
  currentWorkspaceId: string;
  insideSidebar?: boolean;
  isMinimal?: boolean;
};

const ShareButton = (props: ShareButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const {
    currentApplicationDetails,
    currentWorkspaceId,
    insideSidebar,
    isMinimal,
  } = props;

  const selectedTheme = useSelector(getSelectedAppTheme);

  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;

  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  return (
    <>
      <Button
        borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
        className="h-8 t--app-viewer-share-button"
        data-cy="viewmode-share"
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
      <Modal onOpenChange={(isOpen) => setShowModal(isOpen)} open={showModal}>
        <ModalContent>
          <ModalHeader>{currentApplicationDetails?.name}</ModalHeader>
          <ModalBody>
            <AppInviteUsersForm
              applicationId={currentApplicationDetails?.id}
              placeholder={createMessage(
                INVITE_USERS_PLACEHOLDER,
                cloudHosting,
              )}
              workspaceId={currentWorkspaceId}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShareButton;
