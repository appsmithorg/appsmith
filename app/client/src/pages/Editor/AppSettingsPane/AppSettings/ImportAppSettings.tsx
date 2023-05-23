import {
  UPDATE_VIA_IMPORT_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { Text, Button } from "design-system";
import ImportApplicationModal from "pages/Applications/ImportApplicationModal";
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
      <ImportApplicationModal
        appId={appId}
        isModalOpen={isModalOpen}
        onClose={handleClose}
        toApp
        workspaceId={workspace?.id}
      />
    </>
  );
}
