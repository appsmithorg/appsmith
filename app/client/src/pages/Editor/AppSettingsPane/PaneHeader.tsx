import { PopoverPosition } from "@blueprintjs/core";
import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import {
  APP_SETTINGS_CLOSE_TOOLTIP,
  APP_SETTINGS_PANE_HEADER,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { Icon, IconSize, TooltipComponent } from "design-system";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const StyledHeader = styled.div`
  height: 48px;
  padding: 10px 16px 12px;
  box-shadow: 0 1px 0 0 ${Colors.GRAY_300};
`;

const StyledText = styled.div`
  font-size: 16px;
`;

function PaneHeader() {
  const dispatch = useDispatch();
  return (
    <StyledHeader className="flex justify-start items-center">
      <TooltipComponent
        content={APP_SETTINGS_CLOSE_TOOLTIP()}
        position={PopoverPosition.BOTTOM}
      >
        <Icon
          className="pr-2"
          fillColor={Colors.GREY_10}
          id="t--close-app-settings-pane"
          name="double-arrow-right"
          onClick={() => dispatch(closeAppSettingsPaneAction())}
          size={IconSize.SMALL}
        />
      </TooltipComponent>
      <StyledText>{APP_SETTINGS_PANE_HEADER()}</StyledText>
    </StyledHeader>
  );
}

export default PaneHeader;
