import React from "react";
import styled from "styled-components";
import EmojiPicker from "./EmojiPicker";
import { getTypographyByKey } from "constants/DefaultTheme";
import { BaseEmoji } from "emoji-mart";

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Bubble = styled.div<{ active?: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: ${(props) =>
    `${props.theme.spaces[2]}px ${props.theme.spaces[3]}px`};

  background-color: ${(props) =>
    props.active
      ? props.theme.colors.reactionsComponent.reactionBackgroundActive
      : props.theme.colors.reactionsComponent.reactionBackground};
  border-radius: ${(props) => `${props.theme.radii[4]}px`};
  margin-left: ${(props) => `${props.theme.radii[1]}px`};
`;

const Count = styled.div<{ active?: boolean }>`
  display: inline;
  color: ${(props) =>
    props.active
      ? props.theme.colors.reactionsComponent.textActive
      : props.theme.colors.reactionsComponent.text};
  ${(props) => getTypographyByKey(props, "h6")};
  margin-left: ${(props) => props.theme.spaces[1]}px;
  max-width: 30px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

export type Reaction = {
  count: number;
  reactionEmoji: BaseEmoji;
  active?: boolean;
};

export type Reactions = Record<string, Reaction>;

const transformReactions = (reactions: Reactions): Array<Reaction> => {
  return Object.keys(reactions).map((emojiReaction: string) => ({
    ...reactions[emojiReaction],
    emojiReaction,
  }));
};

function EmojiReactions({
  onSelectReaction,
  reactions = {},
}: {
  onSelectReaction: (
    event: React.MouseEvent,
    emojiData: BaseEmoji,
    updatedReactions: Reactions,
  ) => void;
  reactions?: Reactions;
}) {
  const handleSelectReaction = (
    _event: React.MouseEvent,
    emojiData: BaseEmoji,
  ) => {
    const reactionsObject = reactions[emojiData.native];
    if (reactionsObject) {
      if (reactionsObject.active) {
        reactions[emojiData.native] = {
          active: false,
          reactionEmoji: emojiData,
          count: reactionsObject.count - 1,
        };
        if (reactions[emojiData.native].count === 0)
          delete reactions[emojiData.native];
      } else {
        reactions[emojiData.native] = {
          active: true,
          reactionEmoji: emojiData,
          count: reactionsObject.count + 1,
        };
      }
    } else {
      reactions[emojiData.native] = {
        active: true,
        reactionEmoji: emojiData,
        count: 1,
      };
    }
    onSelectReaction(_event, emojiData, { ...reactions });
  };

  return (
    <Container>
      {transformReactions(reactions).map((reaction: Reaction) => (
        <Bubble
          active={reaction.active}
          key={reaction.reactionEmoji.native}
          onClick={(e) => handleSelectReaction(e, reaction.reactionEmoji)}
        >
          <span>{reaction.reactionEmoji.native}</span>
          {reaction.count > 1 && (
            <Count active={reaction.active}>{reaction.count}</Count>
          )}
        </Bubble>
      ))}
      <Bubble>
        <EmojiPicker iconName="reaction" onSelectEmoji={handleSelectReaction} />
      </Bubble>
    </Container>
  );
}

export default EmojiReactions;
