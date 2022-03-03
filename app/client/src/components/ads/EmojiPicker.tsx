import React, { useCallback, useState } from "react";
import { Picker, BaseEmoji } from "emoji-mart";
import { Popover2 } from "@blueprintjs/popover2";
import Icon, { IconName, IconSize } from "components/ads/Icon";

import styled, { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "emoji-mart/css/emoji-mart.css";
import Tooltip from "components/ads/Tooltip";
import {
  ADD_REACTION,
  createMessage,
  EMOJI,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";

const StyledIcon = styled(Icon)<{
  fillColor?: string;
}>`
  &:hover circle,
  &:hover path {
    fill: ${Colors.CHARCOAL};
  }
  ${(props) =>
    props.fillColor
      ? `svg {
        fill: ${props.fillColor};
      }`
      : null}
`;

const EmojiPicker = withTheme(
  ({
    iconName,
    iconSize,
    onSelectEmoji,
    theme,
  }: {
    iconName?: IconName;
    theme: Theme;
    onSelectEmoji: (e: React.MouseEvent, emojiObject: BaseEmoji) => void;
    iconSize?: IconSize;
  }) => {
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
            fillColor={theme.colors.comments.emojiPicker}
            keepColors
            name={iconName || "emoji"}
            size={iconSize || IconSize.XXXL}
          />
        </Tooltip>
      </Popover2>
    );
  },
);

export default EmojiPicker;
