import React from "react";
import { useSelector } from "react-redux";
import UnpublishedCommentThread from "./UnpublishedCommentThread";
import InlineCommentPin from "./InlineCommentPin";
import {
  refCommentThreadsSelector,
  unpublishedCommentThreadSelector,
} from "../../selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

/**
 * Renders comment threads associated with a refId (for example widgetId)
 * Comment thread pins (children) are absolutely positioned from the parent boundary
 * Children set their position themselves
 */
function Comments({ refId }: { refId: string }) {
  const applicationId = useSelector(getCurrentApplicationId);
  const commentsThreadIds = useSelector(
    refCommentThreadsSelector(refId, applicationId),
  );
  const unpublishedCommentThread = useSelector(
    unpublishedCommentThreadSelector(refId),
  );

  return (
    <>
      {Array.isArray(commentsThreadIds) &&
        commentsThreadIds.map((commentsThreadId: any) => (
          <InlineCommentPin
            commentThreadId={commentsThreadId}
            key={commentsThreadId}
          />
        ))}
      {/**
       * Exists in store, not yet created in db
       * Its kept separately in state to reset easily
       * if the user wishes to not create a new thread
       */}
      {unpublishedCommentThread && (
        <UnpublishedCommentThread commentThread={unpublishedCommentThread} />
      )}
    </>
  );
}

export default Comments;
