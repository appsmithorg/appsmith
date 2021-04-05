import commentsReducer from "./commentsReducer";
import { fetchApplicationThreadsMockResponse } from "mockResponses/CommentApiMockResponse";

import {
  createUnpublishedCommentThreadSuccess,
  removeUnpublishedCommentThreads,
  createCommentThreadSuccess,
  addCommentToThreadSuccess,
  fetchApplicationCommentsSuccess,
  updateCommentThreadSuccess,
} from "actions/commentActions";

import {
  applicationCommentThreadsByRefInitial,
  commentThreadsMapInitial,
  unpublishedCommentPayload,
  createCommentThreadSuccessPayload,
  addCommentToThreadSuccessPayload,
  updateCommentThreadPayload,
} from "./testFixtures";

describe("Test comments reducer handles", () => {
  let state: any;
  it("fetch application comments success", () => {
    state = commentsReducer(
      undefined,
      fetchApplicationCommentsSuccess(fetchApplicationThreadsMockResponse.data),
    );

    expect(state.applicationCommentThreadsByRef).toStrictEqual(
      applicationCommentThreadsByRefInitial,
    );
    expect(state.commentThreadsMap).toStrictEqual(commentThreadsMapInitial);
  });

  it("create unpublished comment thread", () => {
    state = commentsReducer(
      state,
      createUnpublishedCommentThreadSuccess(unpublishedCommentPayload),
    );
    expect(state.unpublishedCommentThreads).toEqual(unpublishedCommentPayload);
  });

  it("remove unpublished comment thread", () => {
    state = commentsReducer(state, removeUnpublishedCommentThreads());
    expect(state.unpublishedCommentThreads).toEqual({});
  });

  it("create comment thread", () => {
    const prevState = JSON.parse(JSON.stringify(state));
    state = commentsReducer(
      state,
      createCommentThreadSuccess(createCommentThreadSuccessPayload),
    );
    expect(state.commentThreadsMap).toEqual({
      ...state.commentThreadsMap,
      [createCommentThreadSuccessPayload.id]: createCommentThreadSuccessPayload,
    });

    expect(state.applicationCommentThreadsByRef).toEqual({
      ...prevState.applicationCommentThreadsByRef,
      [createCommentThreadSuccessPayload.applicationId]: {
        ...prevState.applicationCommentThreadsByRef[
          createCommentThreadSuccessPayload.applicationId
        ],
        [createCommentThreadSuccessPayload.refId]: Array.from(
          new Set([
            ...((prevState.applicationCommentThreadsByRef[
              createCommentThreadSuccessPayload.applicationId
            ] || {})[createCommentThreadSuccessPayload.refId] || []),
            createCommentThreadSuccessPayload.id,
          ]),
        ),
      },
    });
  });

  it("add comment to thread", () => {
    const prevState = JSON.parse(JSON.stringify(state));
    state = commentsReducer(
      state,
      addCommentToThreadSuccess(addCommentToThreadSuccessPayload),
    );

    expect(state.commentThreadsMap).toEqual({
      ...state.commentThreadsMap,
      [addCommentToThreadSuccessPayload.commentThreadId]: {
        ...prevState.commentThreadsMap[
          addCommentToThreadSuccessPayload.commentThreadId
        ],
        comments: [
          ...prevState.commentThreadsMap[
            addCommentToThreadSuccessPayload.commentThreadId
          ].comments,
          addCommentToThreadSuccessPayload.comment,
        ],
      },
    });
  });

  it("thread updates", () => {
    state = commentsReducer(
      state,
      updateCommentThreadSuccess(updateCommentThreadPayload),
    );
    expect(
      state.commentThreadsMap[updateCommentThreadPayload.id],
    ).toStrictEqual({
      ...state.commentThreadsMap[updateCommentThreadPayload.id],
      ...updateCommentThreadPayload,
    });
  });

  // TODO add tests for handlers for socket events
  // ReduxActionTypes.NEW_COMMENT_THREAD_EVENT
  // ReduxActionTypes.NEW_COMMENT_EVENT
  // ReduxActionTypes.UPDATE_COMMENT_THREAD_EVENT
});
