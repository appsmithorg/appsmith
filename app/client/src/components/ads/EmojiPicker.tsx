import React, { useCallback, useState } from "react";
import Picker, { IEmojiData } from "emoji-picker-react";
import { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover, Position } from "@blueprintjs/core";
import { Theme } from "constants/DefaultTheme";

// TODO remove: (trigger tests)
const EmojiPicker = withTheme(
  ({
    theme,
    onSelectEmoji,
  }: {
    theme: Theme;
    onSelectEmoji: (e: React.MouseEvent, emojiObject: IEmojiData) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectEmoji = useCallback(
      (e: React.MouseEvent, emojiObject: IEmojiData) => {
        onSelectEmoji(e, emojiObject);
        setIsOpen(false);
      },
      [onSelectEmoji],
    );

    return (
      <Popover
        boundary="viewport"
        isOpen={isOpen}
        minimal
        onInteraction={(nextOpenState) => {
          setIsOpen(nextOpenState);
        }}
        position={Position.BOTTOM_RIGHT}
      >
        <Icon
          fillColor={theme.colors.comments.emojiPicker}
          name="emoji"
          size={IconSize.LARGE}
        />
        <Picker onEmojiClick={handleSelectEmoji} />
      </Popover>
    );
  },
);

export default EmojiPicker;
