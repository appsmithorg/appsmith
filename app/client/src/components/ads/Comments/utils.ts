import { CommentThread } from "components/ads/Comments/CommentsInterfaces";
import { uniqueId } from "lodash";

export const reduceCommentsByRef = (comments: any[]) => {
  return comments.reduce((res, curr) => {
    return {
      commentThreadsMap: {
        ...res.commentThreadsMap,
        [curr.id]: curr,
      },
      refCommentThreads: {
        ...(res.refCommentThreads ? res.refCommentThreads : {}),
        [curr.refId]: [
          ...(res.refCommentThreads && res.refCommentThreads[curr.refId]
            ? res.refCommentThreads[curr.refId]
            : []),
          curr.id,
        ],
      },
    };
  }, {});
};

export const transformPublishedCommentActionPayload = (
  payload: any,
): Record<string, CommentThread> => {
  return {
    [payload.refId]: {
      ...payload,
      position: payload.position,
      id: "UNPUBLISHED",
    },
  };
};

export const transformUnpublishCommentThreadToCreateNew = (payload: any) => {
  const { commentBody, commentThread } = payload;
  return {
    ...commentThread,
    comments: [{ body: commentBody, authorName: uniqueId() }],
  };
};
