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
import classNames from "classnames";
import { useIsAppSidebarEnabled } from "../../../navigation/featureFlagHooks";

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
  const isAppSidebarEnabled = useIsAppSidebarEnabled();

  return (
    <StyledHeader
      className={classNames({
        "flex justify-start items-center py-2.5": !isAppSidebarEnabled,
        "flex items-center py-2.5 pl-4": isAppSidebarEnabled,
      })}
    >
      {!isAppSidebarEnabled && (
        <Tooltip content={APP_SETTINGS_CLOSE_TOOLTIP()} placement="bottom">
          <Button
            className="ml-2 pr-2"
            id="t--close-app-settings-pane"
            isIconButton
            kind="tertiary"
            onClick={() => dispatch(closeAppSettingsPaneAction())}
            size="md"
            startIcon={"double-arrow-right"}
          />
        </Tooltip>
      )}
      <StyledText>{APP_SETTINGS_PANE_HEADER()}</StyledText>
    </StyledHeader>
  );
}

export default PaneHeader;
