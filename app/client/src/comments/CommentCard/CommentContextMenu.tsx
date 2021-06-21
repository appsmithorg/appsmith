import React, { useCallback, useMemo, useState } from "react";
import Icon, { IconSize } from "components/ads/Icon";
import styled from "styled-components";
import {
  PIN_COMMENT,
  COPY_LINK,
  DELETE_COMMENT,
  DELETE_THREAD,
  UNPIN_COMMENT,
  createMessage,
  EDIT_COMMENT,
} from "constants/messages";
import { noop } from "lodash";
import CommentContextMenuOption from "./CommentContextMenuOption";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { Popover2 } from "@blueprintjs/popover2";

// render over popover portals
const Container = styled.div``;

const StyledIcon = styled(Icon)`
  margin-left: ${(props) => props.theme.spaces[2]}px;
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
            <CommentContextMenuOption
              handleClick={handleClick}
              key={option.icon}
              option={option}
            />
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
      <StyledIcon name="comment-context-menu" size={IconSize.LARGE} />
    </Popover2>
  );
}

export default CommentContextMenu;
