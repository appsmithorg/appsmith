import React, { useCallback, useState } from "react";
import { Picker, BaseEmoji } from "emoji-mart";
import { Popover2 } from "@blueprintjs/popover2";
import Icon, { IconName, IconSize } from "components/ads/Icon";

import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "emoji-mart/css/emoji-mart.css";

// TODO remove: (trigger tests)
const EmojiPicker = withTheme(
  ({
    onSelectEmoji,
    theme,
  }: {
    iconName?: IconName;
    theme: Theme;
    onSelectEmoji: (e: React.MouseEvent, emojiObject: BaseEmoji) => void;
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
        content={<Picker onClick={handleSelectEmoji} />}
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
          keepColors
          name={iconName || "emoji"}
          size={IconSize.LARGE}
        />
      </Popover2>
    );
  },
);

export default EmojiPicker;
