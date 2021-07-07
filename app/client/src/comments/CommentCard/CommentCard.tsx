import React, { useCallback, useEffect, useState } from "react";
import Editor from "@draft-js-plugins/editor";
import {
  CompositeDecorator,
  convertFromRaw,
  DraftDecorator,
  EditorState,
  RawDraftContentState,
} from "draft-js";
import styled from "styled-components";
import ProfileImage, { Profile } from "pages/common/ProfileImage";
import { Comment, Reaction } from "entities/Comments/CommentsInterfaces";
import { getTypographyByKey } from "constants/DefaultTheme";
import CommentContextMenu from "./CommentContextMenu";
import ResolveCommentButton from "comments/CommentCard/ResolveCommentButton";
import { MentionComponent } from "components/ads/MentionsInput";
import Icon, { IconSize } from "components/ads/Icon";
import EmojiReactions, {
  Reaction as ComponentReaction,
  Reactions,
  ReactionOperation,
} from "components/ads/EmojiReactions";
import { Toaster } from "components/ads/Toast";
import AddCommentInput from "comments/inlineComments/AddCommentInput";

import createMentionPlugin from "@draft-js-plugins/mention";
import { flattenDeep, noop } from "lodash";
import copy from "copy-to-clipboard";
import moment from "moment";
import history from "utils/history";

import { getAppMode } from "selectors/applicationSelectors";

import { USER_PHOTO_URL } from "constants/userConstants";

import { getCommentThreadURL } from "../utils";

import {
  deleteCommentRequest,
  markThreadAsReadRequest,
  pinCommentThreadRequest,
  editCommentRequest,
  deleteCommentThreadRequest,
  addCommentReaction,
  removeCommentReaction,
} from "actions/commentActions";
import { useDispatch, useSelector } from "react-redux";
import { commentThreadsSelector } from "selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { createMessage, LINK_COPIED_SUCCESSFULLY } from "constants/messages";
import { Variant } from "components/ads/common";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import { TourType } from "entities/Tour";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";

const StyledContainer = styled.div`
  width: 100%;
  padding: ${(props) =>
    `${props.theme.spaces[6]}px ${props.theme.spaces[5]}px`};
  border-radius: 0;
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.comments.cardHoverBackground};
  }
`;

const CommentBodyContainer = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[4]}px;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[4]}px;
`;

const UserName = styled.span`
  ${(props) => getTypographyByKey(props, "h5")}
  color: ${(props) => props.theme.colors.comments.profileUserName};
  margin-left: ${(props) => props.theme.spaces[4]}px;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* number of lines to show */
  -webkit-box-orient: vertical;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;

  & ${Profile} {
    flex-shrink: 0;
  }
`;

const CommentTime = styled.div`
  color: ${(props) => props.theme.colors.comments.commentTime};
  ${(props) => getTypographyByKey(props, "p3")}
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
`;

const CommentSubheader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  white-space: nowrap;

  ${(props) => getTypographyByKey(props, "p3")}

  color: ${(props) => props.theme.colors.comments.pinnedByText};

  & .thread-id {
    flex-shrink: 0;
    max-width: 50px;
  }

  & .pin {
    margin: 0 ${(props) => props.theme.spaces[3]}px;
  }

  strong {
    white-space: pre;
    margin-left: ${(props) => props.theme.spaces[0]}px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

const CommentThreadId = styled.div`
  color: ${(props) => props.theme.colors.comments.commentTime};
  ${(props) => getTypographyByKey(props, "p3")}
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Section = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadIndicator = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.theme.colors.comments.unreadIndicatorCommentCard};
  margin-right: ${(props) => props.theme.spaces[2]}px;
  flex-shrink: 0;
`;

const ReactionsRow = styled.div`
  display: flex;
`;

const EmojiReactionsBtnContainer = styled.div``;

const mentionPlugin = createMentionPlugin({
  mentionComponent: MentionComponent,
});
const plugins = [mentionPlugin];
const decorators = flattenDeep(plugins.map((plugin) => plugin.decorators));
const decorator = new CompositeDecorator(
  decorators.filter((_decorator, index) => index !== 1) as DraftDecorator[],
);

function StopClickPropagation({ children }: { children: React.ReactNode }) {
  return (
    <div
      // flex to unset height, so that align-items works as expected
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      style={{ display: "flex" }}
    >
      {children}
    </div>
  );
}

const replyText = (replies?: number) => {
  if (!replies) return "";
  return replies > 1 ? `${replies} Replies` : `1 Reply`;
};

enum CommentCardModes {
  EDIT = "EDIT",
  VIEW = "VIEW",
}

const reduceReactions = (
  reactions: Array<Reaction> | undefined,
  username?: string,
) => {
  return (
    (Array.isArray(reactions) &&
      reactions.reduce(
        (res: Record<string, ComponentReaction>, reaction: Reaction) => {
          const { byUsername, emoji } = reaction;
          const sameAsCurrent = byUsername === username;
          if (res[reaction.emoji]) {
            res[reaction.emoji].count++;
            if (!sameAsCurrent) {
              res[reaction.emoji].users = [
                ...(res[reaction.emoji].users || []),
                byUsername,
              ];
            }
          } else {
            const users = !sameAsCurrent ? [byUsername] : [];
            res[emoji] = {
              count: 1,
              reactionEmoji: emoji,
              users,
            } as ComponentReaction;
          }

          if (sameAsCurrent) {
            res[reaction.emoji].active = true;
          }

          return res;
        },
        {},
      )) ||
    undefined
  );
};

const ResolveButtonContainer = styled.div`
  margin-left: ${(props) => props.theme.spaces[2]}px;
`;

function CommentCard({
  comment,
  commentThreadId,
  inline,
  isParentComment,
  numberOfReplies,
  resolved,
  showReplies,
  showSubheader,
  toggleResolved,
  unread = true,
  visible,
}: {
  comment: Comment;
  isEditMode?: boolean;
  isParentComment?: boolean;
  resolved?: boolean;
  toggleResolved?: () => void;
  commentThreadId: string;
  numberOfReplies?: number;
  showReplies?: boolean;
  showSubheader?: boolean;
  unread?: boolean;
  inline?: boolean;
  visible?: boolean;
}) {
  const proceedToNextTourStep = useProceedToNextTourStep(
    TourType.COMMENTS_TOUR_EDIT_MODE,
    3,
  );

  const [isHovered, setIsHovered] = useState(false);
  const [cardMode, setCardMode] = useState(CommentCardModes.VIEW);
  const dispatch = useDispatch();
  const { authorName, authorUsername, body, id: commentId } = comment;
  const contentState = convertFromRaw(body as RawDraftContentState);
  const editorState = EditorState.createWithContent(contentState, decorator);
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const [reactions, setReactions] = useState<Reactions>();
  const currentUser = useSelector(getCurrentUser);
  const currentUserUsername = currentUser?.username;

  const isPinned = commentThread.pinnedState?.active;
  const pinnedByUsername = commentThread.pinnedState?.authorUsername;
  let pinnedBy = commentThread.pinnedState?.authorName;

  const appMode = useSelector(getAppMode);

  if (currentUserUsername === pinnedByUsername) {
    pinnedBy = "You";
  }

  const applicationId = useSelector(getCurrentApplicationId);

  const commentThreadURL = getCommentThreadURL({
    applicationId,
    commentThreadId,
    isResolved: !!commentThread?.resolvedState?.active,
    pageId: commentThread?.pageId,
    mode: appMode,
  });

  const copyCommentLink = () => {
    copy(commentThreadURL.toString());
    Toaster.show({
      text: createMessage(LINK_COPIED_SUCCESSFULLY),
      variant: Variant.success,
    });
  };

  const pin = useCallback(() => {
    dispatch(
      pinCommentThreadRequest({ threadId: commentThreadId, pin: !isPinned }),
    );
  }, [isPinned]);

  const deleteComment = useCallback(() => {
    dispatch(deleteCommentRequest({ threadId: commentThreadId, commentId }));
  }, []);

  const deleteThread = () => {
    dispatch(deleteCommentThreadRequest(commentThreadId));
  };

  const isCreatedByMe = currentUserUsername === comment.authorUsername;

  const switchToEditCommentMode = () => setCardMode(CommentCardModes.EDIT);
  const switchToViewCommentMode = () => setCardMode(CommentCardModes.VIEW);

  const onSaveComment = (body: RawDraftContentState) => {
    dispatch(editCommentRequest({ commentId, commentThreadId, body }));
    setCardMode(CommentCardModes.VIEW);
  };

  const contextMenuProps = {
    switchToEditCommentMode,
    pin,
    copyCommentLink,
    deleteComment,
    deleteThread,
    isParentComment,
    isCreatedByMe,
    isPinned,
  };

  // TODO enable when comments links are enabled
  // useSelectCommentUsingQuery(comment.id);

  // Dont make inline cards clickable
  const handleCardClick = () => {
    if (inline) return;
    history.push(
      `${commentThreadURL.pathname}${commentThreadURL.search}${commentThreadURL.hash}`,
    );
    if (!commentThread.isViewed) {
      dispatch(markThreadAsReadRequest(commentThreadId));
    }
  };

  useEffect(() => {
    setReactions(reduceReactions(comment.reactions, currentUserUsername));
  }, [comment.reactions]);

  const handleReaction = (
    _event: React.MouseEvent,
    emojiData: string,
    updatedReactions: Reactions,
    addOrRemove: ReactionOperation,
  ) => {
    setReactions(updatedReactions);
    if (addOrRemove == ReactionOperation.ADD) {
      dispatch(addCommentReaction({ emoji: emojiData, commentId }));
    } else {
      dispatch(removeCommentReaction({ emoji: emojiData, commentId }));
    }
  };

  const showOptions = visible || isHovered;

  const showResolveBtn =
    (showOptions || !!resolved) && isParentComment && toggleResolved;

  const hasReactions = !!reactions && Object.keys(reactions).length > 0;

  return (
    <StyledContainer
      data-cy={`t--comment-card-${comment.id}`}
      onClick={handleCardClick}
      onMouseLeave={() => setIsHovered(false)}
      onMouseOver={() => setIsHovered(true)}
    >
      {showSubheader && (
        <CommentSubheader>
          <Section className="thread-id">
            {unread && <UnreadIndicator />}
            <CommentThreadId>{commentThread.sequenceId}</CommentThreadId>
          </Section>
          <Section className="pinned-by" onClick={pin}>
            {isPinned && (
              <>
                <Icon className="pin" name="pin-3" />
                <span>Pinned By</span>
                <strong>{` ${pinnedBy}`}</strong>
              </>
            )}
          </Section>
        </CommentSubheader>
      )}
      <CommentHeader>
        <HeaderSection>
          <ProfileImage
            side={25}
            source={`/api/${USER_PHOTO_URL}/${authorUsername}`}
            userName={authorName || ""}
          />
          <UserName>{authorName}</UserName>
        </HeaderSection>
        <HeaderSection>
          {showOptions && (
            <StopClickPropagation>
              <EmojiReactionsBtnContainer>
                <EmojiReactions
                  hideReactions
                  iconSize={IconSize.XXL}
                  onSelectReaction={handleReaction}
                  reactions={reactions}
                />
              </EmojiReactionsBtnContainer>
            </StopClickPropagation>
          )}
          {showResolveBtn && (
            <StopClickPropagation>
              <ResolveButtonContainer>
                {inline ? (
                  <TourTooltipWrapper
                    tourIndex={3}
                    tourType={TourType.COMMENTS_TOUR_EDIT_MODE}
                  >
                    <ResolveCommentButton
                      handleClick={() => {
                        toggleResolved && toggleResolved();
                        proceedToNextTourStep();
                      }}
                      resolved={!!resolved}
                    />
                  </TourTooltipWrapper>
                ) : (
                  <ResolveCommentButton
                    handleClick={toggleResolved as () => void}
                    resolved={!!resolved}
                  />
                )}
              </ResolveButtonContainer>
            </StopClickPropagation>
          )}
          {showOptions && (
            <StopClickPropagation>
              <CommentContextMenu {...contextMenuProps} />
            </StopClickPropagation>
          )}
        </HeaderSection>
      </CommentHeader>
      <CommentBodyContainer>
        {cardMode === CommentCardModes.EDIT ? (
          <AddCommentInput
            initialEditorState={editorState}
            onCancel={switchToViewCommentMode}
            onSave={onSaveComment}
            removePadding
          />
        ) : (
          <Editor
            editorState={editorState}
            onChange={noop}
            plugins={plugins}
            readOnly
          />
        )}
      </CommentBodyContainer>
      <CommentTime>
        <span>{moment(comment.creationTime).fromNow()}</span>
        <span>{showReplies && replyText(numberOfReplies)}</span>
      </CommentTime>
      {hasReactions && (
        <ReactionsRow>
          <StopClickPropagation>
            <EmojiReactions
              iconSize={IconSize.LARGE}
              onSelectReaction={handleReaction}
              reactions={reactions}
            />
          </StopClickPropagation>
        </ReactionsRow>
      )}
    </StyledContainer>
  );
}

export default CommentCard;
