import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useTransition } from "react-spring";

import {
  getSortedAppCommentThreadIds,
  applicationCommentsSelector,
  allCommentThreadsMap,
  getAppCommentThreads,
  shouldShowResolved as shouldShowResolvedSelector,
} from "selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import CommentThread from "comments/CommentThread/connectedCommentThread";
import AppCommentsPlaceholder from "./AppCommentsPlaceholder";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`;

const AppCommentThreads = () => {
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );
  const appCommentThreadIds = getAppCommentThreads(appCommentThreadsByRefMap);
  const commentThreadsMap = useSelector(allCommentThreadsMap);

  const shouldShowResolved = useSelector(shouldShowResolvedSelector);

  const commentThreadIds = useMemo(
    () =>
      getSortedAppCommentThreadIds(
        appCommentThreadIds,
        commentThreadsMap,
        shouldShowResolved,
      ),
    [appCommentThreadIds, commentThreadsMap],
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
          key={key}
          transition={props}
          commentThreadId={commentThreadId}
          hideInput
          hideChildren
          showSubheader
        />
      ))}
      {!commentsExist && <AppCommentsPlaceholder />}
    </Container>
  );
};

export default AppCommentThreads;
