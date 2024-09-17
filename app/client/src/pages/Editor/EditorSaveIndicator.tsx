import React from "react";
import styled from "styled-components";
import { TextType, Text } from "@appsmith/ads-old";
import { Colors } from "constants/Colors";
import { createMessage, EDITOR_HEADER } from "ee/constants/messages";
import { Icon, Spinner } from "@appsmith/ads";

const SaveStatusContainer = styled.div`
  align-items: center;
  display: flex;
`;

export function EditorSaveIndicator({
  isSaving,
  saveError,
}: {
  isSaving: boolean;
  saveError: boolean;
}) {
  let saveStatusIcon: React.ReactNode;
  let saveStatusText = "";
  if (isSaving) {
    saveStatusIcon = <Spinner className="t--save-status-is-saving" />;
    saveStatusText = createMessage(EDITOR_HEADER.saving);
  } else {
    if (saveError) {
      saveStatusIcon = (
        <Icon className={"t--save-status-error"} name="cloud-off-line" />
      );
      saveStatusText = createMessage(EDITOR_HEADER.saveFailed);
    }
  }

  if (!saveError && !isSaving) return null;

  return (
    <SaveStatusContainer className={"t--save-status-container gap-x-1"}>
      {saveStatusIcon}
      <Text color={Colors.GREY_9} type={TextType.P3}>
        {saveStatusText}
      </Text>
    </SaveStatusContainer>
  );
}
