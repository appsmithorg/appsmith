import React from "react";
import styled from "styled-components";
import EmojiPicker from "./EmojiPicker";
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
  reactionEmoji: string;
  active?: boolean;
};

export type Reactions = Record<string, Reaction>;

const transformReactions = (reactions: Reactions): Array<Reaction> => {
  return Object.keys(reactions).map((emojiReaction: string) => ({
    ...reactions[emojiReaction],
    emojiReaction,
  }));
};

export enum ReactionOperation {
  ADD = "ADD",
  REMOVE = "REMOVE",
}

function EmojiReactions({
  onSelectReaction,
  reactions = {},
  hideReactions = false,
  iconSize = IconSize.XXL,
}: {
  onSelectReaction: (
    event: React.MouseEvent,
    emojiData: string,
    updatedReactions: Reactions,
    addOrRemove: ReactionOperation,
  ) => void;
  reactions?: Reactions;
  hideReactions?: boolean;
  iconSize?: IconSize;
}) {
  const handleSelectReaction = (
    _event: React.MouseEvent,
    emojiData: string,
  ) => {
    const reactionsObject = reactions[emojiData];
    let addOrRemove;
    if (reactionsObject) {
      if (reactionsObject.active) {
        addOrRemove = ReactionOperation.REMOVE;
        reactions[emojiData] = {
          active: false,
          reactionEmoji: emojiData,
          count: reactionsObject.count - 1,
        };
        if (reactions[emojiData].count === 0) delete reactions[emojiData];
      } else {
        reactions[emojiData] = {
          active: true,
          reactionEmoji: emojiData,
          count: reactionsObject.count + 1,
        };
      }
    } else {
      addOrRemove = ReactionOperation.ADD;
      reactions[emojiData] = {
        active: true,
        reactionEmoji: emojiData,
        count: 1,
      };
    }
    onSelectReaction(
      _event,
      emojiData,
      { ...reactions },
      addOrRemove as ReactionOperation,
    );
  };

  return (
    <Container>
      {!hideReactions &&
        transformReactions(reactions).map((reaction: Reaction) => (
          <Bubble
            active={reaction.active}
            key={reaction.reactionEmoji}
            onClick={(e) => handleSelectReaction(e, reaction.reactionEmoji)}
          >
            <span>{reaction.reactionEmoji}</span>
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
            onSelectEmoji={(e, emoji) => handleSelectReaction(e, emoji.native)}
          />
        </Bubble>
      ) : (
        <EmojiPicker
          iconName="reaction-2"
          iconSize={iconSize}
          onSelectEmoji={(e, emoji) => handleSelectReaction(e, emoji.native)}
        />
      )}
    </Container>
  );
}

export default EmojiReactions;
