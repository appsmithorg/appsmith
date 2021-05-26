import { put } from "redux-saga/effects";
import {
  setCommentThreadsSuccess,
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
  updateCommentEvent,
} from "actions/commentActions";
import { COMMENT_EVENTS } from "constants/CommentConstants";
import { reduceCommentsByRef } from "comments/utils";

export default function* handleCommentEvents(event: any) {
  switch (event.type) {
    case COMMENT_EVENTS.SET_COMMENTS: {
      const comments = event.payload;
      const payload = reduceCommentsByRef(comments);
      yield put(setCommentThreadsSuccess(payload));
      return;
    }
    case COMMENT_EVENTS.INSERT_COMMENT_THREAD: {
      yield put(newCommentThreadEvent(event.payload[0]));
      return;
    }
    case COMMENT_EVENTS.INSERT_COMMENT: {
      yield put(newCommentEvent(event.payload[0]));
      return;
    }
    case COMMENT_EVENTS.UPDATE_COMMENT_THREAD: {
      yield put(updateCommentThreadEvent(event.payload[0].thread));
      return;
    }
    case COMMENT_EVENTS.UPDATE_COMMENT: {
      yield put(updateCommentEvent(event.payload[0].comment));
      return;
    }
  }
}
