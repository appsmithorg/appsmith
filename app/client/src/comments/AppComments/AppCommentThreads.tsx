import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";

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

import useResizeObserver from "utils/hooks/useResizeObserver";
import { get } from "lodash";

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

  const containerRef = useRef<HTMLDivElement>(null);

  const [appThreadsHeightEqZero, setAppThreadsHeightEqZero] = useState(true);

  useResizeObserver(containerRef.current, (entries) => {
    const { height } = get(entries, "0.contentRect", {});
    setAppThreadsHeightEqZero(height === 0);
  });

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

  return (
    <Container>
      <div ref={containerRef}>
        {commentThreadIds.map((commentThreadId: string) => (
          <CommentThread
            commentThreadId={commentThreadId}
            hideChildren
            hideInput
            key={commentThreadId}
            showSubheader
          />
        ))}
      </div>
      {appThreadsHeightEqZero && <AppCommentsPlaceholder />}
    </Container>
  );
}

export default AppCommentThreads;
