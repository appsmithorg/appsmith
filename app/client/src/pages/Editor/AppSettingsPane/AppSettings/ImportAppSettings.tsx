import {
  UPDATE_VIA_IMPORT_SETTING,
  createMessage,
} from "ee/constants/messages";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { Text, Button } from "@appsmith/ads";
import ImportModal from "pages/common/ImportModal";
import React from "react";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getIsGitConnected } from "selectors/gitSyncSelectors";
import styled from "styled-components";

const SettingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

export function ImportAppSettings() {
  const appId = useSelector(getCurrentApplicationId);
  const workspace = useSelector(getCurrentAppWorkspace);
  const isGitConnected = useSelector(getIsGitConnected);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  function handleClose() {
    setIsModalOpen(false);
  }

  return (
    <>
      <SettingWrapper>
        <Text kind="heading-s">
          {createMessage(UPDATE_VIA_IMPORT_SETTING.settingHeader)}
        </Text>
        <Text kind="body-m">
          {isGitConnected
            ? createMessage(UPDATE_VIA_IMPORT_SETTING.disabledForGit)
            : createMessage(UPDATE_VIA_IMPORT_SETTING.settingContent)}
        </Text>
        <Button
          UNSAFE_width="40%"
          data-testid="t--app-setting-import-btn"
          isDisabled={isGitConnected}
          onClick={() => setIsModalOpen(true)}
          size="sm"
        >
          {createMessage(UPDATE_VIA_IMPORT_SETTING.settingActionButtonTxt)}
        </Button>
      </SettingWrapper>
      <ImportModal
        editorId={appId}
        isModalOpen={isModalOpen}
        onClose={handleClose}
        toEditor
        workspaceId={workspace?.id}
      />
    </>
  );
}
