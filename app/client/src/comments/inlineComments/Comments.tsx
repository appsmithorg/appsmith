import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import UnpublishedCommentThread from "./UnpublishedCommentThread";
import InlineCommentPin from "./InlineCommentPin";
import {
  commentThreadsSelector,
  refCommentThreadsSelector,
  unpublishedCommentThreadSelector,
  visibleCommentThreadSelector,
} from "../../selectors/commentsSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { useLocation } from "react-router";
import { AppState } from "reducers";
import { useSortedCommentThreadIds } from "../AppComments/AppCommentThreads";

// TODO refactor application comment threads by page id to optimise
// if lists turn out to be expensive
function InlinePageCommentPin({
  commentThreadId,
  focused,
}: {
  commentThreadId: string;
  focused: boolean;
}) {
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const currentPageId = useSelector(getCurrentPageId);
  const isVisibleCommentThread = useSelector(
    (state: AppState) =>
      visibleCommentThreadSelector(state) === commentThreadId,
  );

  if (commentThread && commentThread.pageId !== currentPageId) return null;

  return (
    <InlineCommentPin
      commentThreadId={commentThreadId}
      focused={focused || isVisibleCommentThread}
    />
  );
}

const MemoisedInlinePageCommentPin = React.memo(InlinePageCommentPin);

export const useSelectCommentThreadUsingQuery = () => {
  const location = useLocation();
  const [commentThreadIdInUrl, setCommentThreadIdInUrl] = useState<
    string | null
  >();

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const commentThreadIdInUrl = searchParams.get("commentThreadId");
    setCommentThreadIdInUrl(commentThreadIdInUrl);
  }, [location]);

  return commentThreadIdInUrl;
};

/**
 * Renders comment threads associated with a refId (for example widgetId)
 * Comment thread pins (children) are absolutely positioned from the parent boundary
 * Children set their position themselves
 */
function Comments({ refId }: { refId: string }) {
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const commentThreadIdsByRef = useSelector(
    refCommentThreadsSelector(refId, applicationId),
  );
  const commentThreadIds = useSortedCommentThreadIds(
    applicationId,
    commentThreadIdsByRef as string[],
  );
  const unpublishedCommentThread = useSelector(
    unpublishedCommentThreadSelector(refId),
  );
  const commentThreadIdInUrl = useSelectCommentThreadUsingQuery();

  return (
    <>
      {Array.isArray(commentThreadIds) &&
        commentThreadIds
          .slice()
          .reverse()
          .map((commentsThreadId: any) => (
            <MemoisedInlinePageCommentPin
              commentThreadId={commentsThreadId}
              focused={commentThreadIdInUrl === commentsThreadId}
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
