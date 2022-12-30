import React, { useState } from "react";

import { useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment/moment";
import RefreshLineIcon from "remixicon-react/RefreshLineIcon";
import { AppState } from "@appsmith/reducers";
import { Icon, TextType, Text } from "design-system";
import { HeaderIcons } from "icons/HeaderIcons";
import { getIsPageSaving, getPageSavingError } from "selectors/editorSelectors";
import {
  createMessage,
  EDITOR_HEADER_SAVE_INDICATOR,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";

const SaveStatusContainer = styled.div`
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  .bp3-popover-target {
    display: flex;
  }
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
  const [lastUpdatedTimeMessage, setLastUpdatedTimeMessage] = useState<string>(
    createMessage(EDITOR_HEADER_SAVE_INDICATOR),
  );

  const lastUpdatedTime = useSelector(
    (state: AppState) => state.ui.editor.lastUpdatedTime,
  );
  const isSaving = useSelector(getIsPageSaving);
  const pageSaveError = useSelector(getPageSavingError);

  const findLastUpdatedTimeMessage = () => {
    const savedMessage = createMessage(EDITOR_HEADER_SAVE_INDICATOR);
    setLastUpdatedTimeMessage(
      lastUpdatedTime
        ? `${savedMessage} ${moment(lastUpdatedTime * 1000).fromNow()}`
        : savedMessage,
    );
  };

  let saveStatusIcon: React.ReactNode;
  let saveStatusText = "";
  if (isSaving) {
    saveStatusIcon = (
      <StyledLoader className="t--save-status-is-saving" name="refresh" />
    );
    saveStatusText = "Saving";
  } else {
    if (pageSaveError) {
      saveStatusIcon = (
        <Icon className={"t--save-status-error"} name="cloud-off-line" />
      );
      saveStatusText = "Save failed";
    }
  }

  if (!pageSaveError) return null;

  return (
    <SaveStatusContainer className={"t--save-status-container"}>
      {saveStatusIcon}
      <Text color={Colors.GREY_9} type={TextType.P3}>
        {saveStatusText}
      </Text>
    </SaveStatusContainer>
  );
}
