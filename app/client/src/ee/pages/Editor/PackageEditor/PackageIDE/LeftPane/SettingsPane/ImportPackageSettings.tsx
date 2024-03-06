import {
  PACKAGE_UPDATE_VIA_IMPORT_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import { getCurrentModuleId } from "@appsmith/selectors/modulesSelector";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { Text, Button } from "design-system";
import ImportModal from "pages/common/ImportModal";
import React from "react";
import { useSelector } from "react-redux";
import { getIsGitConnected } from "selectors/gitSyncSelectors";
import styled from "styled-components";

const SettingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

function ImportPackageSettings() {
  const moduleId = useSelector(getCurrentModuleId);
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
          {createMessage(PACKAGE_UPDATE_VIA_IMPORT_SETTING.settingHeader)}
        </Text>
        <Text kind="body-m">
          {isGitConnected
            ? createMessage(PACKAGE_UPDATE_VIA_IMPORT_SETTING.disabledForGit)
            : createMessage(PACKAGE_UPDATE_VIA_IMPORT_SETTING.settingContent)}
        </Text>
        <Button
          UNSAFE_width="40%"
          data-testid="t--app-setting-import-btn"
          isDisabled={isGitConnected}
          onClick={() => setIsModalOpen(true)}
          size="sm"
        >
          {createMessage(
            PACKAGE_UPDATE_VIA_IMPORT_SETTING.settingActionButtonTxt,
          )}
        </Button>
      </SettingWrapper>
      <ImportModal
        editorId={moduleId}
        isModalOpen={isModalOpen}
        onClose={handleClose}
        toEditor
        workspaceId={workspace?.id}
      />
    </>
  );
}

export default ImportPackageSettings;
