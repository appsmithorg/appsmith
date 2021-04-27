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
  isParentComment?: boolean;
  isCreatedByMe?: boolean;
};

const CommentContextMenu = ({
  pin,
  copyCommentLink,
  deleteComment,
  isParentComment,
  // TODO figure out key for isCreatedByMe
  isCreatedByMe,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    const options = [];
    if (isParentComment) {
      // TODO add edit option
      // TODO add pin option
      options.push(
        // {
        //   icon: "pin-2",
        //   display: createMessage(PIN_COMMENT),
        //   onClick: pin,
        // },
        {
          icon: "link-2",
          display: createMessage(COPY_LINK),
          onClick: copyCommentLink,
        },
      );
    }

    if (isCreatedByMe && !isParentComment) {
      options.push({
        icon: "trash",
        display: createMessage(DELETE_COMMENT),
        onClick: deleteComment,
      });
    }

    return options;
  }, []);

  const handleInteraction = useCallback((isOpen) => {
    setIsOpen(isOpen);
  }, []);

  const handleClick = useCallback((option) => {
    setIsOpen(false);
    option.onClick();
  }, []);

  if (!options.length) return null;

  return (
    <Popover2
      isOpen={isOpen}
      placement={"bottom-end"}
      portalClassName="comment-context-menu"
      onInteraction={handleInteraction}
      modifiers={{ offset: { enabled: true, options: { offset: [7, 15] } } }}
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
    >
      <StyledIcon name="comment-context-menu" size={IconSize.LARGE} />
    </Popover2>
  );
};

export default CommentContextMenu;
