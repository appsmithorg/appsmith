import React, { useCallback, useMemo, useState } from "react";
import Icon, { IconSize, IconName } from "components/ads/Icon";
import styled from "styled-components";
import {
  PIN_COMMENT,
  COPY_LINK,
  DELETE_COMMENT,
  createMessage,
} from "constants/messages";
import { noop } from "lodash";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { Popover2 } from "@blueprintjs/popover2";

// render over popover portals
const Container = styled.div`
  z-index: 11;
`;

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
  pin: typeof noop;
  copyCommentLink: typeof noop;
  deleteComment: typeof noop;
};

function CommentContextMenu({ pin, copyCommentLink, deleteComment }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(
    () => [
      {
        icon: "pin-2",
        display: createMessage(PIN_COMMENT),
        onClick: pin,
      },
      {
        icon: "link-2",
        display: createMessage(COPY_LINK),
        onClick: copyCommentLink,
      },
      {
        icon: "trash",
        display: createMessage(DELETE_COMMENT),
        onClick: deleteComment,
      },
    ],
    [],
  );

  const handleInteraction = useCallback((isOpen) => {
    setIsOpen(isOpen);
  }, []);

  const handleClick = useCallback((option) => {
    setIsOpen(false);
    option.onClick();
  }, []);

  return (
    <Popover2
      content={
        <Container>
          {options.map((option) => (
            <MenuItem key={option.icon} onClick={() => handleClick(option)}>
              <MenuIcon>
                <StyledIcon name={option.icon as IconName} size={IconSize.XL} />
              </MenuIcon>
              <MenuTitle>{option.display}</MenuTitle>
            </MenuItem>
          ))}
        </Container>
      }
      isOpen={isOpen}
      minimal
      onInteraction={handleInteraction}
      placement={"bottom-end"}
      portalClassName="comment-context-menu"
    >
      <StyledIcon name="context-menu" size={IconSize.LARGE} />
    </Popover2>
  );
}

export default CommentContextMenu;
