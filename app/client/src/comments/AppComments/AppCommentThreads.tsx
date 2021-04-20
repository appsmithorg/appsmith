import React, { useMemo } from "react";
import {
  getSortedAppCommentThreadIds,
  applicationCommentsSelector,
  allCommentThreadsMap,
  getAppCommentThreads,
} from "selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useSelector } from "react-redux";

import CommentThread from "comments/CommentThread/connectedCommentThread";

const AppCommentThreads = () => {
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );
  const appCommentThreadIds = getAppCommentThreads(appCommentThreadsByRefMap);
  const commentThreadsMap = useSelector(allCommentThreadsMap);

  const commentThreadIds = useMemo(
    () => getSortedAppCommentThreadIds(appCommentThreadIds, commentThreadsMap),
    [appCommentThreadIds, commentThreadsMap],
  );

  return (
    <>
      {commentThreadIds?.map((commentThreadId: string) => (
        <CommentThread
          key={commentThreadId}
          commentThreadId={commentThreadId}
          hideInput
        />
      ))}
    </>
  );
};

export default AppCommentThreads;
