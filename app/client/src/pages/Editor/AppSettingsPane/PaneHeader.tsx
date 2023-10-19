import React from "react";
import styled from "styled-components";
import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import {
  APP_SETTINGS_CLOSE_TOOLTIP,
  APP_SETTINGS_PANE_HEADER,
} from "@appsmith/constants/messages";
import { Tooltip } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "design-system";
import { getIsAppSidebarEnabled } from "selectors/ideSelectors";
import classNames from "classnames";

const StyledHeader = styled.div`
  height: 48px;
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
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);

  return (
    <StyledHeader
      className={classNames({
        "flex justify-start items-center py-2.5": !isAppSidebarEnabled,
        "flex justify-between	flex-row-reverse items-center py-2.5 pl-4":
          isAppSidebarEnabled,
      })}
    >
      <Tooltip content={APP_SETTINGS_CLOSE_TOOLTIP()} placement="bottom">
        <Button
          className="ml-2 pr-2"
          id="t--close-app-settings-pane"
          isIconButton
          kind="tertiary"
          onClick={() => dispatch(closeAppSettingsPaneAction())}
          size="md"
          startIcon={
            isAppSidebarEnabled ? "close-control" : "double-arrow-right"
          }
        />
      </Tooltip>
      <StyledText>{APP_SETTINGS_PANE_HEADER()}</StyledText>
    </StyledHeader>
  );
}

export default PaneHeader;
