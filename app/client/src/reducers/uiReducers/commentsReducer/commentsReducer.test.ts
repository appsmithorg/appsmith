import { renderHook } from "@testing-library/react-hooks";
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
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
} from "actions/commentActions";

import {
  applicationCommentThreadsByRefInitial,
  commentThreadsMapInitial,
  unpublishedCommentPayload,
  createCommentThreadSuccessPayload,
  addCommentToThreadSuccessPayload,
  newCommentThreadEventPayload,
  updateCommentThreadEventPayload,
  newCommentEventPayload,
} from "./testFixtures";
import { CommentThread } from "entities/Comments/CommentsInterfaces";
import * as reactRedux from "react-redux";
import { useHasUnreadCommentThread } from "../../../pages/Editor/ToggleModeButton";

describe("Test comments reducer handles", () => {
  const useSelectorMock = jest.spyOn(reactRedux, "useSelector");
  let state: any;
  it("fetch application comments success", () => {
    const commentThreads = fetchApplicationThreadsMockResponse.data as CommentThread[];
    state = commentsReducer(
      undefined,
      fetchApplicationCommentsSuccess({
        commentThreads,
        applicationId:
          fetchApplicationThreadsMockResponse.data[0].applicationId,
      }),
    );
    useSelectorMock.mockReturnValue(state);
    const { result } = renderHook(() =>
      useHasUnreadCommentThread(newCommentThreadEventPayload.applicationId),
    );
    expect(result.current).toBeFalsy();
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
    expect(state.unpublishedCommentThreads).toStrictEqual(
      unpublishedCommentPayload,
    );
  });

  it("remove unpublished comment thread", () => {
    state = commentsReducer(state, removeUnpublishedCommentThreads());
    expect(state.unpublishedCommentThreads).toStrictEqual({});
  });

  it("create comment thread", () => {
    const prevState = JSON.parse(JSON.stringify(state));
    state = commentsReducer(
      state,
      createCommentThreadSuccess(createCommentThreadSuccessPayload),
    );
    useSelectorMock.mockReturnValue(state);
    const { result } = renderHook(() =>
      useHasUnreadCommentThread(
        createCommentThreadSuccessPayload.applicationId,
      ),
    );
    expect(result.current).toBeTruthy();
    expect(state.commentThreadsMap).toStrictEqual({
      ...state.commentThreadsMap,
      [createCommentThreadSuccessPayload.id]: createCommentThreadSuccessPayload,
    });

    expect(state.applicationCommentThreadsByRef).toStrictEqual({
      ...prevState.applicationCommentThreadsByRef,
      [createCommentThreadSuccessPayload.applicationId]: {
        ...prevState.applicationCommentThreadsByRef[
          createCommentThreadSuccessPayload.applicationId
        ],
        [createCommentThreadSuccessPayload.refId]: Array.from(
          new Set([
            createCommentThreadSuccessPayload.id,
            ...((prevState.applicationCommentThreadsByRef[
              createCommentThreadSuccessPayload.applicationId
            ] || {})[createCommentThreadSuccessPayload.refId] || []),
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

    expect(state.commentThreadsMap).toStrictEqual({
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
    const threadUpdate: CommentThread =
      fetchApplicationThreadsMockResponse.data[0];
    threadUpdate.resolvedState = { active: true };

    state = commentsReducer(state, updateCommentThreadSuccess(threadUpdate));

    expect(state.commentThreadsMap[threadUpdate.id]).toStrictEqual({
      ...state.commentThreadsMap[threadUpdate.id],
      ...threadUpdate,
    });
  });

  it("new comment thread real time event", () => {
    const prevState = JSON.parse(JSON.stringify(state || {}));
    state = commentsReducer(
      state,
      newCommentThreadEvent(newCommentThreadEventPayload),
    );

    expect(state.commentThreadsMap).toStrictEqual({
      ...state.commentThreadsMap,
      [newCommentThreadEventPayload._id]: {
        ...newCommentThreadEventPayload,
        id: newCommentThreadEventPayload._id,
        comments:
          state.commentThreadsMap[newCommentThreadEventPayload._id].comments ||
          [],
      },
    });

    expect(state.applicationCommentThreadsByRef).toStrictEqual({
      ...prevState.applicationCommentThreadsByRef,
      [newCommentThreadEventPayload.applicationId]: {
        ...prevState.applicationCommentThreadsByRef[
          newCommentThreadEventPayload.applicationId
        ],
        [newCommentThreadEventPayload.refId]: Array.from(
          new Set([
            newCommentThreadEventPayload._id,
            ...((prevState.applicationCommentThreadsByRef[
              newCommentThreadEventPayload.applicationId
            ] || {})[newCommentThreadEventPayload.refId] || []),
          ]),
        ),
      },
    });
  });

  it("new comment real time event", () => {
    const prevState = JSON.parse(JSON.stringify(state));
    state = commentsReducer(state, newCommentEvent(newCommentEventPayload));

    expect(
      state.commentThreadsMap[newCommentEventPayload.comment.threadId]
        .comments[1],
    ).toStrictEqual(
      {
        ...prevState.commentThreadsMap[newCommentEventPayload.comment.threadId],
        comments: [
          ...((
            prevState.commentThreadsMap[
              newCommentEventPayload.comment.threadId
            ] || {}
          ).comments || []),
          {
            ...newCommentEventPayload.comment,
            id: newCommentEventPayload.comment._id,
          },
        ],
      }.comments[1],
    );
  });

  it("thread update event", () => {
    state = commentsReducer(
      state,
      updateCommentThreadEvent(updateCommentThreadEventPayload),
    );

    expect(
      state.commentThreadsMap[updateCommentThreadEventPayload._id],
    ).toStrictEqual({
      ...state.commentThreadsMap[updateCommentThreadEventPayload._id],
      ...updateCommentThreadEventPayload,
    });
  });
});
