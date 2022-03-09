import React, { useCallback, useMemo, useState } from "react";
import Icon, { IconSize, IconName } from "components/ads/Icon";
import styled from "styled-components";
import {
  PIN_COMMENT,
  COPY_LINK,
  DELETE_COMMENT,
  DELETE_THREAD,
  UNPIN_COMMENT,
  createMessage,
  EDIT_COMMENT,
  MORE_OPTIONS,
} from "@appsmith/constants/messages";
import { noop } from "lodash";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { Popover2 } from "@blueprintjs/popover2";
import Tooltip from "components/ads/Tooltip";
import { Colors } from "constants/Colors";

// render over popover portals
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
  padding-left: ${(props) => props.theme.spaces[2]}px;
  &:hover svg {
    fill: ${Colors.CHARCOAL};
  }
`;

const MenuIcon = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[5]}px`};

  svg {
    fill: ${(props) => props.theme.colors.comments.unresolved};
  }
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
  deleteThread: typeof noop;
  switchToEditCommentMode: typeof noop;
  isParentComment?: boolean;
  isCreatedByMe?: boolean;
  isPinned?: boolean;
};

function CommentContextMenu({
  copyCommentLink,
  deleteComment,
  deleteThread,
  isCreatedByMe,
  isParentComment,
  isPinned,
  pin,
  switchToEditCommentMode,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    const options = [];
    if (isParentComment) {
      options.push(
        {
          icon: isPinned ? "unpin" : "pin-3",
          display: isPinned
            ? createMessage(UNPIN_COMMENT)
            : createMessage(PIN_COMMENT),
          onClick: pin,
        },
        {
          icon: "link-2",
          display: createMessage(COPY_LINK),
          onClick: copyCommentLink,
        },
      );
    }

    if (isCreatedByMe) {
      if (!isParentComment) {
        options.push({
          icon: "trash",
          display: createMessage(DELETE_COMMENT),
          onClick: deleteComment,
        });
      } else {
        options.push({
          icon: "trash",
          display: createMessage(DELETE_THREAD),
          onClick: deleteThread,
        });
      }

      options.push({
        icon: "edit",
        display: createMessage(EDIT_COMMENT),
        onClick: switchToEditCommentMode,
      });
    }

    return options;
  }, [isPinned]);

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
      content={
        <Container>
          {options.map((option) => (
            <MenuItem key={option.icon} onClick={() => handleClick(option)}>
              <MenuIcon>
                <Icon
                  keepColors
                  name={option.icon as IconName}
                  size={IconSize.XXL}
                />
              </MenuIcon>
              <MenuTitle>{option.display}</MenuTitle>
            </MenuItem>
          ))}
        </Container>
      }
      isOpen={isOpen}
      minimal
      modifiers={{ offset: { enabled: true, options: { offset: [7, 15] } } }}
      onInteraction={handleInteraction}
      placement={"bottom-end"}
      portalClassName="comment-context-menu"
    >
      <Tooltip content={createMessage(MORE_OPTIONS)} hoverOpenDelay={1000}>
        <StyledIcon name="comment-context-menu" size={IconSize.XXL} />
      </Tooltip>
    </Popover2>
  );
}

export default CommentContextMenu;
