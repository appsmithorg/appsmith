import React from "react";
import styled from "styled-components";
import { APP_SETTINGS_PANE_HEADER } from "ee/constants/messages";

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
  return (
    <StyledHeader className={"flex items-center py-2.5 pl-4"}>
      <StyledText>{APP_SETTINGS_PANE_HEADER()}</StyledText>
    </StyledHeader>
  );
}

export default PaneHeader;
