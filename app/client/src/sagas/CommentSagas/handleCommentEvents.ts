import { put } from "redux-saga/effects";
import {
  setCommentThreadsSuccess,
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
} from "actions/commentActions";
import { COMMENT_EVENTS } from "constants/CommentConstants";
import { reduceCommentsByRef } from "components/ads/Comments/utils";

export default function* handleCommentEvents(event: any) {
  // TODO use constants here
  switch (event.type) {
    case COMMENT_EVENTS.SET_COMMENTS: {
      const comments = event.payload;
      const payload = reduceCommentsByRef(comments);
      yield put(setCommentThreadsSuccess(payload));
      return;
    }
    case "insert:commentThread": {
      yield put(newCommentThreadEvent(event.payload[0]));
      return;
    }
    case "insert:comment": {
      yield put(newCommentEvent(event.payload[0]));
      return;
    }
    case "update:commentThread": {
      yield put(updateCommentThreadEvent(event.payload[0].comment));
      return;
    }
  }
}
