import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import {
  allCommentThreadsMap,
  appCommentsFilter as appCommentsFilterSelector,
  applicationCommentsSelector,
  getAppCommentThreads,
  getCommentThreadsFetched,
  getSortedAndFilteredAppCommentThreadIds,
  shouldShowResolved as shouldShowResolvedSelector,
  getLastUpdatedCommentThreadId,
} from "selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import CommentThread from "comments/CommentThread/connectedCommentThread";
import AppCommentsPlaceholder from "./AppCommentsPlaceholder";
import { getCurrentUser } from "selectors/usersSelectors";

import { Virtuoso } from "react-virtuoso";
import { setShouldShowResolvedComments } from "actions/commentActions";
import { useSelectCommentThreadUsingQuery } from "../inlineComments/Comments";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import ScrollIndicator from "components/ads/ScrollIndicator";
import { COMMENT_HAS_BEEN_DELETED, createMessage } from "constants/messages";
import { hideScrollbar } from "constants/DefaultTheme";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  // Hiding the scroll of react-virtuoso
  & > div:first-child {
    ${hideScrollbar};
  }
`;

export const useSortedCommentThreadIds = (
  applicationId: string,
  commentThreadIds: string[],
) => {
  const commentThreadsMap = useSelector(allCommentThreadsMap);
  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const appCommentsFilter = useSelector(appCommentsFilterSelector);

  const currentUser = useSelector(getCurrentUser);
  const currentUsername = currentUser?.username;
  const lastUpdatedCommentThreadId = useSelector(
    getLastUpdatedCommentThreadId(applicationId),
  );

  return useMemo(
    () =>
      getSortedAndFilteredAppCommentThreadIds(
        commentThreadIds,
        commentThreadsMap,
        shouldShowResolved,
        appCommentsFilter,
        currentUsername,
      ),
    [
      commentThreadIds,
      commentThreadsMap,
      shouldShowResolved,
      appCommentsFilter,
      currentUsername,
      lastUpdatedCommentThreadId,
    ],
  );
};

function AppCommentThreads() {
  const dispatch = useDispatch();
  const commentThreadIdFromUrl = useSelectCommentThreadUsingQuery();
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );
  const appCommentThreadIds = getAppCommentThreads(appCommentThreadsByRefMap);
  const containerRef = useRef<HTMLElement | Window | null>(null);

  const commentThreadIds = useSortedCommentThreadIds(
    applicationId,
    appCommentThreadIds,
  );

  const commentThreadsMap = useSelector(allCommentThreadsMap);

  // TODO (rishabh s) Update this when adding pagination to comments
  const appCommentThreadsFetched = useSelector(getCommentThreadsFetched);

  // Getting the ref of the inner div used of react-virtuoso which is responsible
  // for the scroll
  const scrollerRef = React.useCallback(
    (element: HTMLElement | Window | null) => {
      if (element) {
        containerRef.current = element as HTMLElement;
      }
    },
    [],
  );
  useEffect(() => {
    // if user is visiting a comment thread link which is already resolved,
    // we'll activate the resolved comments filter
    if (commentThreadIdFromUrl && appCommentThreadsFetched) {
      const commentInStore = commentThreadsMap[commentThreadIdFromUrl];

      if (commentInStore) {
        if (commentInStore.resolvedState?.active) {
          dispatch(setShouldShowResolvedComments(true));
        }
      } else {
        Toaster.show({
          text: createMessage(COMMENT_HAS_BEEN_DELETED),
          variant: Variant.warning,
        });
      }
    }
  }, [commentThreadIdFromUrl, appCommentThreadsFetched]);

  return (
    <Container>
      {commentThreadIds.length > 0 && (
        <Virtuoso
          data={commentThreadIds}
          itemContent={(_index, commentThreadId) => (
            /** Keeping this as a fail safe: since zero
             * height elements throw an error
             * */
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
          scrollerRef={scrollerRef}
        />
      )}
      {commentThreadIds.length === 0 && <AppCommentsPlaceholder />}
      <ScrollIndicator containerRef={containerRef as any} top={"50px"} />
    </Container>
  );
}

export default AppCommentThreads;
