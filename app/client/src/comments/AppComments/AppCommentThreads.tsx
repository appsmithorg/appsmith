import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useTransition } from "react-spring";

import {
  getSortedAndFilteredAppCommentThreadIds,
  applicationCommentsSelector,
  allCommentThreadsMap,
  getAppCommentThreads,
  shouldShowResolved as shouldShowResolvedSelector,
  appCommentsFilter as appCommentsFilterSelector,
} from "selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import CommentThread from "comments/CommentThread/connectedCommentThread";
import AppCommentsPlaceholder from "./AppCommentsPlaceholder";
import { getCurrentUser } from "selectors/usersSelectors";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`;

function AppCommentThreads() {
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );
  const appCommentThreadIds = getAppCommentThreads(appCommentThreadsByRefMap);
  const commentThreadsMap = useSelector(allCommentThreadsMap);
  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const appCommentsFilter = useSelector(appCommentsFilterSelector);

  const currentUser = useSelector(getCurrentUser);
  const currentUsername = currentUser?.username;

  const commentThreadIds = useMemo(
    () =>
      getSortedAndFilteredAppCommentThreadIds(
        appCommentThreadIds,
        commentThreadsMap,
        shouldShowResolved,
        appCommentsFilter,
        currentUsername,
      ),
    [
      appCommentThreadIds,
      commentThreadsMap,
      shouldShowResolved,
      appCommentsFilter,
      currentUsername,
    ],
  );

  const commentsExist = commentThreadIds.length > 0;

  const transition = useTransition(commentThreadIds, (s) => s, {
    from: { opacity: 0, transform: "translateX(-100%)" },
    enter: { opacity: 1, transform: "translateX(0)" },
    leave: { opacity: 0, transform: "translateX(-100%)" },
    config: { duration: 300 },
  });

  return (
    <Container>
      {transition.map(({ item: commentThreadId, props, key }) => (
        <CommentThread
          commentThreadId={commentThreadId}
          hideChildren
          hideInput
          key={key}
          showSubheader
          transition={props}
        />
      ))}
      {!commentsExist && <AppCommentsPlaceholder />}
    </Container>
  );
}

export default AppCommentThreads;
