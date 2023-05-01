import {
  UPDATE_VIA_IMPORT_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { Button, Text, TextType } from "design-system-old";
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
  color: var(--appsmith-color-black-800);

  .import-btn {
    width: 40%;
  }
`;

const StyledText = styled(Text)`
  color: var(--appsmith-color-black-800);

  &.setting-header {
    font-weight: 500;
  }
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
        <StyledText className="setting-header" type={TextType.P1}>
          {createMessage(UPDATE_VIA_IMPORT_SETTING.settingHeader)}
        </StyledText>
        <StyledText type={TextType.P3}>
          {isGitConnected
            ? createMessage(UPDATE_VIA_IMPORT_SETTING.disabledForGit)
            : createMessage(UPDATE_VIA_IMPORT_SETTING.settingContent)}
        </StyledText>
        <Button
          className="import-btn"
          cypressSelector="t--app-setting-import-btn"
          disabled={isGitConnected}
          onClick={() => setIsModalOpen(true)}
          size="small"
          tag="button"
          text={createMessage(
            UPDATE_VIA_IMPORT_SETTING.settingActionButtonTxt,
          ).toLocaleUpperCase()}
        />
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
