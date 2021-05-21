import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { COMMENTS, createMessage } from "constants/messages";

import AppCommentsFilterPopover from "./AppCommentsFilterPopover";

const AppCommentHeaderTitle = styled.div`
  color: ${(props) => props.theme.colors.comments.appCommentsHeaderTitle};
  ${(props) => getTypographyByKey(props, "h5")}
`;

const Header = styled.div`
  display: flex;
  padding: ${(props) => props.theme.spaces[6]}px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid
    ${(props) => props.theme.colors.comments.appCommentsHeaderBorder};
`;

function AppCommentsHeader() {
  return (
    <Header>
      <AppCommentHeaderTitle>{createMessage(COMMENTS)}</AppCommentHeaderTitle>
      <AppCommentsFilterPopover />
    </Header>
  );
}

export default AppCommentsHeader;
