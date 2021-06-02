import React, { useMemo } from "react";
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
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";

import CommentThread from "comments/CommentThread/connectedCommentThread";
import AppCommentsPlaceholder from "./AppCommentsPlaceholder";
import { getCurrentUser } from "selectors/usersSelectors";

import { Virtuoso } from "react-virtuoso";

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

  const currentPageId = useSelector(getCurrentPageId);

  const commentThreadIds = useMemo(
    () =>
      getSortedAndFilteredAppCommentThreadIds(
        appCommentThreadIds,
        commentThreadsMap,
        shouldShowResolved,
        appCommentsFilter,
        currentUsername,
        currentPageId,
      ),
    [
      appCommentThreadIds,
      commentThreadsMap,
      shouldShowResolved,
      appCommentsFilter,
      currentUsername,
      currentPageId,
    ],
  );

  return (
    <Container>
      <Virtuoso
        data={commentThreadIds}
        itemContent={(_index, commentThreadId) => (
          /**
           * zero height elements are not supported by react virtuso
           * we filter the elements from the list but in the intermediate
           * state there is a possibility when the comment thread id exists
           * in the list, using this as a temporary workaround and a fail safe
           * until we are sure this doesn't happen
           */
          <div style={{ minHeight: 1 }}>
            <CommentThread
              commentThreadId={commentThreadId}
              hideChildren
              hideInput
              key={commentThreadId}
              showSubheader
            />
          </div>
        )}
      />
      {commentThreadIds.length === 0 && <AppCommentsPlaceholder />}
    </Container>
  );
}

export default AppCommentThreads;
