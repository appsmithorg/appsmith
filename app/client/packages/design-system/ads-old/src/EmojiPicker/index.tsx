import React, { useCallback, useState } from "react";
import type { BaseEmoji } from "emoji-mart";
import { Picker } from "emoji-mart";
import { Popover2 } from "@blueprintjs/popover2";
import type { IconName } from "../Icon";
import Icon, { IconSize } from "../Icon";
import styled from "styled-components";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "emoji-mart/css/emoji-mart.css";
import Tooltip from "../Tooltip";
import { ADD_REACTION, createMessage, EMOJI } from "../constants/messages";

const StyledIcon = styled(Icon)<{
  fillColor?: string;
}>`
  &:hover circle,
  &:hover path {
    fill: var(--ads-color-black-750);
  }
  ${(props) =>
    props.fillColor
      ? `svg {
        fill: ${props.fillColor};
      }`
      : null}
`;

function EmojiPicker({
  iconName,
  iconSize,
  onSelectEmoji,
}: {
  iconName?: IconName;
  onSelectEmoji: (e: React.MouseEvent, emojiObject: BaseEmoji) => void;
  iconSize?: IconSize;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectEmoji = useCallback(
    (emoji, event) => {
      onSelectEmoji(event, emoji);
      setIsOpen(false);
    },
    [onSelectEmoji],
  );

  return (
    <Popover2
      content={
        <Picker
          onClick={handleSelectEmoji}
          showPreview={false}
          showSkinTones={false}
          style={{
            border: "none",
            borderRadius: 0,
          }}
        />
      }
      isOpen={isOpen}
      minimal
      onInteraction={(nextOpenState) => {
        setIsOpen(nextOpenState);
      }}
      portalClassName="emoji-picker-portal"
    >
      <Tooltip
        content={createMessage(iconName ? ADD_REACTION : EMOJI)}
        hoverOpenDelay={1000}
      >
        <StyledIcon
          fillColor="var(--ads-color-black-450)"
          keepColors
          name={iconName || "emoji"}
          size={iconSize != null || IconSize.XXXL}
        />
      </Tooltip>
    </Popover2>
  );
}

export default EmojiPicker;
