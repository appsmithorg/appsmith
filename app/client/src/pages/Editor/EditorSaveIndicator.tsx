import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment/moment";

import { AppState } from "reducers";
import TooltipComponent from "components/ads/Tooltip";
import { HeaderIcons } from "icons/HeaderIcons";
import ThreeDotLoading from "components/designSystems/appsmith/header/ThreeDotsLoading";
import { getIsPageSaving, getPageSavingError } from "selectors/editorSelectors";

const SaveStatusContainer = styled.div`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export function EditorSaveIndicator() {
  const [lastUpdatedTimeMessage, setLastUpdatedTimeMessage] = useState<string>(
    "",
  );

  const lastUpdatedTime = useSelector(
    (state: AppState) => state.ui.editor.lastUpdatedTime,
  );
  const isSaving = useSelector(getIsPageSaving);
  const pageSaveError = useSelector(getPageSavingError);

  const findLastUpdatedTimeMessage = () => {
    setLastUpdatedTimeMessage(
      lastUpdatedTime
        ? `Saved ${moment(lastUpdatedTime * 1000).fromNow()}`
        : "",
    );
  };

  useEffect(() => {
    findLastUpdatedTimeMessage();
    const interval = setInterval(
      findLastUpdatedTimeMessage,
      (moment.relativeTimeThreshold("ss") as number) * 1000,
    );
    return () => {
      clearInterval(interval);
    };
  }, [lastUpdatedTime]);

  let saveStatusIcon: React.ReactNode;
  if (isSaving) {
    saveStatusIcon = <ThreeDotLoading className="t--save-status-is-saving" />;
  } else {
    if (!pageSaveError) {
      saveStatusIcon = (
        <TooltipComponent content={lastUpdatedTimeMessage} hoverOpenDelay={200}>
          <HeaderIcons.SAVE_SUCCESS
            className="t--save-status-success"
            color={"#36AB80"}
            height={20}
            width={20}
          />
        </TooltipComponent>
      );
    } else {
      saveStatusIcon = (
        <HeaderIcons.SAVE_FAILURE
          className={"t--save-status-error"}
          color={"#F69D2C"}
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
