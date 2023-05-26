import React from "react";

import { useSelector } from "react-redux";
import styled from "styled-components";
import { TextType, Text } from "design-system-old";
import { getIsPageSaving, getPageSavingError } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import { createMessage, EDITOR_HEADER } from "@appsmith/constants/messages";
import { Icon, Spinner } from "design-system";

const SaveStatusContainer = styled.div`
  align-items: center;
  display: flex;
`;

export function EditorSaveIndicator() {
  const isSaving = useSelector(getIsPageSaving);
  const pageSaveError = useSelector(getPageSavingError);

  let saveStatusIcon: React.ReactNode;
  let saveStatusText = "";
  if (isSaving) {
    saveStatusIcon = <Spinner className="t--save-status-is-saving" />;
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
