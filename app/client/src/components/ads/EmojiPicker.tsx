import React, { useCallback, useState } from "react";
import Picker, { IEmojiData } from "emoji-picker-react";
import { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { Popover2 } from "@blueprintjs/popover2";

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
      <Popover2
        content={<Picker onEmojiClick={handleSelectEmoji} />}
        isOpen={isOpen}
        minimal
        onInteraction={(nextOpenState) => {
          setIsOpen(nextOpenState);
        }}
        placement="bottom-end"
        portalClassName="emoji-picker-portal"
      >
        <Icon
          fillColor={theme.colors.comments.emojiPicker}
          name="emoji"
          size={IconSize.LARGE}
        />
      </Popover2>
    );
  },
);

export default EmojiPicker;
