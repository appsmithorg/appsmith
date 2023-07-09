import React from "react";
import styled from "styled-components";
import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import {
  APP_SETTINGS_CLOSE_TOOLTIP,
  APP_SETTINGS_PANE_HEADER,
} from "@appsmith/constants/messages";
import { Tooltip } from "design-system";
import { useDispatch } from "react-redux";
import { Button } from "design-system";

const StyledHeader = styled.div`
  height: 48px;
  padding: 10px 0px 10px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  margin-bottom: 0;
`;

const StyledText = styled.div`
  font-size: 16px;
  margin-left: 4px;
  color: var(--ads-v2-color-fg-emphasis);
`;

function PaneHeader() {
  const dispatch = useDispatch();
  return (
    <StyledHeader className="flex justify-start items-center">
      <Tooltip content={APP_SETTINGS_CLOSE_TOOLTIP()} placement="bottom">
        <Button
          className="ml-2 pr-2"
          id="t--close-app-settings-pane"
          isIconButton
          kind="tertiary"
          onClick={() => dispatch(closeAppSettingsPaneAction())}
          size="md"
          startIcon="double-arrow-right"
        />
      </Tooltip>
      <StyledText>{APP_SETTINGS_PANE_HEADER()}</StyledText>
    </StyledHeader>
  );
}

export default PaneHeader;
