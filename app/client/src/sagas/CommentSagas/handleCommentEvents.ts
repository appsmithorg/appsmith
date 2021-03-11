import { put } from "redux-saga/effects";
import { setCommentThreadsSuccess } from "actions/commentActions";
import { COMMENT_EVENTS } from "constants/CommentConstants";
import { reduceCommentsByRef } from "components/ads/Comments/utils";

export default function* handleCommentEvents(event: any) {
  switch (event.type) {
    case COMMENT_EVENTS.SET_COMMENTS: {
      const comments = event.payload;
      const payload = reduceCommentsByRef(comments);
      yield put(setCommentThreadsSuccess(payload));
      return;
    }
  }
}
