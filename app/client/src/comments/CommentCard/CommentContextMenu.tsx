import React, { useMemo } from "react";
import Icon, { IconSize, IconName } from "components/ads/Icon";
import styled from "styled-components";
import { Popover, PopoverPosition } from "@blueprintjs/core";
import {
  PIN_COMMENT,
  COPY_LINK,
  DELETE_COMMENT,
  createMessage,
} from "constants/messages";
import { noop } from "lodash";

const Container = styled.div``;

const MenuItem = styled.div`
  display: flex;
  width: 180px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.comments.contextMenuItemHover};
  }
`;

const StyledIcon = styled(Icon)`
  && path {
    stroke: ${(props) => props.theme.colors.comments.contextMenuIcon};
    fill: ${(props) => props.theme.colors.comments.contextMenuIcon};
  }
  ${MenuItem}:hover & path {
    stroke: ${(props) =>
      props.theme.colors.comments.contextMenuIconStrokeHover};
  }
`;

const MenuIcon = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[5]}px`};
`;

const MenuTitle = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px 0px;
  color: ${(props) => props.theme.colors.comments.contextMenuTitle};
  ${MenuItem}:hover & {
    color: ${(props) => props.theme.colors.comments.contextMenuTitleHover};
  }
`;

type Props = {
  pinComment: typeof noop;
  copyComment: typeof noop;
  deleteComment: typeof noop;
};

const CommentContextMenu = ({
  pinComment,
  copyComment,
  deleteComment,
}: Props) => {
  const options = useMemo(
    () => [
      {
        icon: "pin-2",
        display: createMessage(PIN_COMMENT),
        onClick: pinComment,
      },
      {
        icon: "link-2",
        display: createMessage(COPY_LINK),
        onClick: copyComment,
      },
      {
        icon: "trash",
        display: createMessage(DELETE_COMMENT),
        onClick: deleteComment,
      },
    ],
    [],
  );

  return (
    <Popover
      minimal
      boundary="viewport"
      popoverClassName="comment-thread"
      position={PopoverPosition.BOTTOM_RIGHT}
    >
      <StyledIcon name="context-menu" size={IconSize.LARGE} />
      <Container>
        {options.map((option) => (
          <MenuItem key={option.icon}>
            <MenuIcon>
              <StyledIcon
                name={option.icon as IconName}
                // fillColor={theme.colors.comments.sendButton}
                size={IconSize.XL}
              />
            </MenuIcon>
            <MenuTitle>{option.display}</MenuTitle>
          </MenuItem>
        ))}
      </Container>
    </Popover>
  );
};

export default CommentContextMenu;
