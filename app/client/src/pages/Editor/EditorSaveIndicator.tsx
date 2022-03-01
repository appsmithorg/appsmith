import React, { useState } from "react";

import { useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment/moment";

import { AppState } from "reducers";
import TooltipComponent from "components/ads/Tooltip";
import { HeaderIcons } from "icons/HeaderIcons";
import { getIsPageSaving, getPageSavingError } from "selectors/editorSelectors";
import {
  createMessage,
  EDITOR_HEADER_SAVE_INDICATOR,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import Icon from "components/ads/Icon";

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
  if (isSaving) {
    saveStatusIcon = (
      <StyledLoader className="t--save-status-is-saving" name="loader" />
    );
  } else {
    if (!pageSaveError) {
      saveStatusIcon = (
        <TooltipComponent
          content={lastUpdatedTimeMessage}
          hoverOpenDelay={200}
          onOpening={findLastUpdatedTimeMessage}
        >
          <HeaderIcons.SAVE_SUCCESS
            className="t--save-status-success"
            color={Colors.GREEN}
            height={20}
            width={20}
          />
        </TooltipComponent>
      );
    } else {
      saveStatusIcon = (
        <HeaderIcons.SAVE_FAILURE
          className={"t--save-status-error"}
          color={Colors.WARNING_SOLID}
          height={20}
          width={20}
        />
      );
    }
  }

  return (
    <SaveStatusContainer className={"t--save-status-container"}>
      {saveStatusIcon}
    </SaveStatusContainer>
  );
}
