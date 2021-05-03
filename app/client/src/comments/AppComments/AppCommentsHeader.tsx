import React, { useCallback } from "react";
import styled, { withTheme } from "styled-components";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import { COMMENTS, createMessage } from "constants/messages";
import Icon from "components/ads/Icon";

const AppCommentHeaderTitle = styled.div`
  color: ${(props) => props.theme.colors.comments.appCommentsHeaderTitle};
  ${(props) => getTypographyByKey(props, "h2")}
`;

const Header = styled.div<{ isOpen: boolean }>`
  display: flex;
  padding: ${(props) =>
    `${props.theme.spaces[6]}px ${props.theme.spaces[8]}px`};
  width: 100%;
  justify-content: space-between;
  cursor: ${(props) => (!props.isOpen ? "pointer" : "auto")};
`;

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onClose: () => void;
  theme: Theme;
};

const AppCommentsHeader = withTheme(
  ({ onClose, isOpen, setIsOpen, theme }: Props) => {
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
