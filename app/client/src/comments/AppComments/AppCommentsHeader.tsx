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
  border-bottom: 1px solid
    ${(props) => props.theme.colors.comments.appCommentsHeaderBorder};
`;

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onClose: () => void;
  theme: Theme;
};

const AppCommentsHeader = withTheme(
  ({ isOpen, onClose, setIsOpen, theme }: Props) => {
    const showCommentThreads = useCallback(() => {
      if (!isOpen) setIsOpen(true);
    }, [isOpen]);

    return (
      <Header isOpen={isOpen} onClick={showCommentThreads}>
        <AppCommentHeaderTitle>{createMessage(COMMENTS)}</AppCommentHeaderTitle>
        {isOpen && (
          <Icon
            fillColor={theme.colors.comments.appCommentsClose}
            name="close-x"
            onClick={onClose}
          />
        )}
      </Header>
    );
  },
);

export default AppCommentsHeader;
