import React from "react";
import styled from "styled-components";
import EmojiPicker from "./EmojiPicker";
import { BaseEmoji } from "emoji-mart";
import { IconSize } from "./Icon";

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Bubble = styled.div<{ active?: boolean }>`
  font-size: 16px; // emoji
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: ${(props) => `2px ${props.theme.spaces[2]}px`};

  background-color: ${(props) =>
    props.active
      ? props.theme.colors.reactionsComponent.reactionBackgroundActive
      : props.theme.colors.reactionsComponent.reactionBackground};

  border: 1px solid
    ${(props) =>
      props.active
        ? props.theme.colors.reactionsComponent.borderActive
        : "transparent"};

  border-radius: ${(props) => `${props.theme.radii[4]}px`};
  margin-left: ${(props) => `${props.theme.radii[1]}px`};
  &:first-child {
    margin-left: 0;
  }
`;

const Count = styled.div<{ active?: boolean }>`
  display: inline;
  color: ${(props) =>
    props.active
      ? props.theme.colors.reactionsComponent.textActive
      : props.theme.colors.reactionsComponent.text};
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
  hideReactions = false,
  iconSize = IconSize.XXL,
}: {
  onSelectReaction: (
    event: React.MouseEvent,
    emojiData: BaseEmoji,
    updatedReactions: Reactions,
  ) => void;
  reactions?: Reactions;
  hideReactions?: boolean;
  iconSize?: IconSize;
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
      {!hideReactions &&
        transformReactions(reactions).map((reaction: Reaction) => (
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
      {!hideReactions ? (
        <Bubble>
          <EmojiPicker
            iconName="reaction"
            iconSize={iconSize}
            onSelectEmoji={handleSelectReaction}
          />
        </Bubble>
      ) : (
        <EmojiPicker
          iconName="reaction-2"
          iconSize={iconSize}
          onSelectEmoji={handleSelectReaction}
        />
      )}
    </Container>
  );
}

export default EmojiReactions;
