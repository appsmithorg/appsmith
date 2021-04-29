import React, { useCallback, useState } from "react";
import Editor from "@draft-js-plugins/editor";
import {
  CompositeDecorator,
  convertFromRaw,
  DraftDecorator,
  EditorState,
  RawDraftContentState,
} from "draft-js";
import styled from "styled-components";
import ProfileImage from "pages/common/ProfileImage";
import { Comment } from "entities/Comments/CommentsInterfaces";
import { getTypographyByKey } from "constants/DefaultTheme";
import CommentContextMenu from "./CommentContextMenu";
import ResolveCommentButton from "comments/CommentCard/ResolveCommentButton";
import { MentionComponent } from "components/ads/MentionsInput";
import Icon from "components/ads/Icon";
import EmojiReactions, { Reactions } from "components/ads/EmojiReactions";
import { Toaster } from "components/ads/Toast";

import createMentionPlugin from "@draft-js-plugins/mention";
import { flattenDeep, noop } from "lodash";
import copy from "copy-to-clipboard";
import moment from "moment";
import history from "utils/history";

import {
  deleteCommentRequest,
  markThreadAsReadRequest,
  pinCommentThreadRequest,
} from "actions/commentActions";
import { useDispatch, useSelector } from "react-redux";
import { commentThreadsSelector } from "selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { createMessage, LINK_COPIED_SUCCESSFULLY } from "constants/messages";
import { Variant } from "components/ads/common";
import { BaseEmoji } from "emoji-mart";

const StyledContainer = styled.div`
  width: 100%;
  padding: ${(props) =>
    `${props.theme.spaces[7]}px ${props.theme.spaces[5]}px`};
  border-radius: 0;
`;

// ${(props) => getTypographyByKey(props, "p1")};
// line-height: 24px;
// color: ${(props) => props.theme.colors.comments.commentBody};
// margin-top: ${(props) => props.theme.spaces[3]}px;

const CommentBodyContainer = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[5]}px;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[5]}px;
`;

const UserName = styled.span`
  ${(props) => getTypographyByKey(props, "h5")}
  color: ${(props) => props.theme.colors.comments.profileUserName};
  margin-left: ${(props) => props.theme.spaces[4]}px;
  display: flex;
  align-items: center;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
`;

const CommentTime = styled.div`
  color: ${(props) => props.theme.colors.comments.commentTime};
  ${(props) => getTypographyByKey(props, "p3")}
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
`;

const CommentSubheader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
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
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
`;

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
  return replies > 1 ? `${replies} replies` : `1 reply`;
};

function CommentCard({
  comment,
  isParentComment,
  toggleResolved,
  resolved,
  commentThreadId,
  numberOfReplies,
  showReplies,
  showSubheader,
  unread = true,
  inline,
}: {
  comment: Comment;
  isParentComment?: boolean;
  resolved?: boolean;
  toggleResolved?: () => void;
  commentThreadId: string;
  numberOfReplies?: number;
  showReplies?: boolean;
  showSubheader?: boolean;
  unread?: boolean;
  inline?: boolean;
}) {
  const dispatch = useDispatch();
  const { authorName, body, id: commentId } = comment;
  const contentState = convertFromRaw(body as RawDraftContentState);
  const editorState = EditorState.createWithContent(contentState, decorator);
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const [reactions, setReactions] = useState<Reactions>();
  const currentUser = useSelector(getCurrentUser);
  const currentUserUsername = currentUser?.username;

  const isPinned = commentThread.pinnedState?.active;
  const pinnedByUsername = commentThread.pinnedState?.authorUsername;
  let pinnedBy = commentThread.pinnedState?.authorName;

  if (currentUserUsername === pinnedByUsername) {
    pinnedBy = "You";
  }

  const getCommentURL = () => {
    const url = new URL(window.location.href);
    // we only link the comment thread currently
    // url.searchParams.set("commentId", commentId);
    url.searchParams.set("commentThreadId", commentThreadId);
    url.searchParams.set("isCommentMode", "true");
    return url;
  };

  const copyCommentLink = useCallback(() => {
    const url = getCommentURL();
    copy(url.toString());
    Toaster.show({
      text: createMessage(LINK_COPIED_SUCCESSFULLY),
      variant: Variant.success,
    });
  }, []);

  const pin = useCallback(() => {
    dispatch(
      pinCommentThreadRequest({ threadId: commentThreadId, pin: !isPinned }),
    );
  }, [isPinned]);

  const deleteComment = useCallback(() => {
    dispatch(deleteCommentRequest({ threadId: commentThreadId, commentId }));
  }, []);

  const isCreatedByMe = currentUserUsername === comment.authorUsername;

  const contextMenuProps = {
    pin,
    copyCommentLink,
    deleteComment,
    isParentComment,
    isCreatedByMe,
    isPinned,
  };

  // TODO enable when comments links are enabled
  // useSelectCommentUsingQuery(comment.id);

  // Dont make inline cards clickable
  const handleCardClick = () => {
    if (inline) return;
    const url = getCommentURL();
    history.push(`${url.pathname}${url.search}${url.hash}`);
    if (!commentThread.isViewed) {
      dispatch(markThreadAsReadRequest(commentThreadId));
    }
  };

  const handleReaction = (
    _event: React.MouseEvent,
    _emojiData: BaseEmoji,
    updatedReactions: Reactions,
  ) => {
    setReactions(updatedReactions);
  };

  return (
    <StyledContainer
      data-cy={`t--comment-card-${comment.id}`}
      onClick={handleCardClick}
    >
      {showSubheader && (
        <CommentSubheader>
          <Section className="thread-id">
            {unread && <UnreadIndicator />}
            <CommentThreadId>{commentThread.sequenceId}</CommentThreadId>
          </Section>
          <Section className="pinned-by">
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
          <ProfileImage side={25} userName={authorName || ""} />
          <UserName>{authorName}</UserName>
        </HeaderSection>
        <HeaderSection>
          <StopClickPropagation>
            {isParentComment && toggleResolved && (
              <ResolveCommentButton
                handleClick={toggleResolved}
                resolved={!!resolved}
              />
            )}
          </StopClickPropagation>
          <StopClickPropagation>
            <CommentContextMenu {...contextMenuProps} />
          </StopClickPropagation>
        </HeaderSection>
      </CommentHeader>
      <CommentBodyContainer>
        <Editor
          editorState={editorState}
          onChange={noop}
          plugins={plugins}
          readOnly
        />
      </CommentBodyContainer>
      <CommentTime>
        <span>{moment().fromNow()}</span>
        <span>{showReplies && replyText(numberOfReplies)}</span>
      </CommentTime>
      <ReactionsRow>
        <StopClickPropagation>
          <EmojiReactions
            onSelectReaction={handleReaction}
            reactions={reactions}
          />
        </StopClickPropagation>
      </ReactionsRow>
    </StyledContainer>
  );
}

export default CommentCard;
