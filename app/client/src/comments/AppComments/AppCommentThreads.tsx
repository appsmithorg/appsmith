import React, { useMemo } from "react";
import { getAppCommentThreads } from "selectors/commentsSelectors";

import { applicationCommentsSelector } from "../../selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useSelector } from "react-redux";

import CommentThread from "comments/CommentThread/connectedCommentThread";

const AppCommentThreads = () => {
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );

  const commentThreadIds = useMemo(
    () => getAppCommentThreads(appCommentThreadsByRefMap),
    [appCommentThreadsByRefMap],
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
