import React, { useState } from "react";
import Picker from "emoji-picker-react";
import { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover, Position } from "@blueprintjs/core";
import { Theme } from "constants/DefaultTheme";

const EmojiPicker = withTheme(
  ({
    theme,
    onSelectEmoji,
  }: {
    theme: Theme;
    onSelectEmoji: (e: any, emojiObject: any) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectEmoji = (e: any, emojiObject: any) => {
      onSelectEmoji(e, emojiObject);
      setIsOpen(false);
    };

    return (
      <Popover
        isOpen={isOpen}
        minimal
        boundary="viewport"
        onInteraction={(nextOpenState) => {
          setIsOpen(nextOpenState);
        }}
        position={Position.BOTTOM_RIGHT}
      >
        <Icon
          name="emoji"
          size={IconSize.LARGE}
          fillColor={theme.colors.comments.emojiPicker}
        />
        <Picker onEmojiClick={handleSelectEmoji} />
      </Popover>
    );
  },
);

export default EmojiPicker;
