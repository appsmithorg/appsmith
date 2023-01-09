import React from "react";

import { useSelector } from "react-redux";
import styled from "styled-components";
import { Icon, TextType, Text } from "design-system";
import { getIsPageSaving, getPageSavingError } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import { createMessage, EDITOR_HEADER } from "ce/constants/messages";

const SaveStatusContainer = styled.div`
  align-items: center;
  display: flex;
`;

const StyledLoader = styled(Icon)`
  animation: spin 2s linear infinite;
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
`;

export function EditorSaveIndicator() {
  const isSaving = useSelector(getIsPageSaving);
  const pageSaveError = useSelector(getPageSavingError);

  let saveStatusIcon: React.ReactNode;
  let saveStatusText = "";
  if (isSaving) {
    saveStatusIcon = (
      <StyledLoader className="t--save-status-is-saving" name="refresh" />
    );
    saveStatusText = createMessage(EDITOR_HEADER.saving);
  } else {
    if (pageSaveError) {
      saveStatusIcon = (
        <Icon className={"t--save-status-error"} name="cloud-off-line" />
      );
      saveStatusText = createMessage(EDITOR_HEADER.saveFailed);
    }
  }

  if (!pageSaveError && !isSaving) return null;

  return (
    <SaveStatusContainer className={"t--save-status-container gap-x-1"}>
      {saveStatusIcon}
      <Text color={Colors.GREY_9} type={TextType.P3}>
        {saveStatusText}
      </Text>
    </SaveStatusContainer>
  );
}
