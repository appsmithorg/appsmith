import React from "react";
import userEvent from "@testing-library/user-event";
import { unmountComponentAtNode } from "react-dom";
import OverlayCommentsWrapper from "../inlineComments/OverlayCommentsWrapper";
import store from "store";
import { render } from "test/testUtils";
import { fetchApplicationCommentsRequest } from "actions/commentActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { setCommentMode } from "actions/commentActions";
import { resetEditorSuccess } from "actions/initActions";
import setMockPages from "./setMockPages";
// import {
//   createNewThreadMockResponse,
//   fetchApplicationThreadsMockResponse,
//   addCommentToThreadMockResponse,
// } from "mockResponses/CommentApiMockResponse";

let container: any = null;
describe("Comment threads", () => {
  beforeEach(async () => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
    // application id is required
    setMockPages();
    store.dispatch(setCommentMode(true));
    // dispatch fetch comments and mock the axios req
    store.dispatch(fetchApplicationCommentsRequest());
    // fetch threads saga waits for init
    store.dispatch({
      type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    });
  });
  it("are rendered", async (done) => {
    // find is a combination of get and waitFor
    // follows a approach waiting for the element to appear on screen
    // instead of waiting for the api execution
    const { findAllByDataCy } = render(
      <OverlayCommentsWrapper refId="0">
        <div style={{ height: 100, width: 100 }} />
      </OverlayCommentsWrapper>,
      container,
    );
    const commentPins = await findAllByDataCy("inline-comment-pin");
    expect(commentPins).toHaveLength(8);
    done();
  });

  // TODO uncomment once add comment input is finalised
  // it("can be created", async (done) => {
  //   const { getByDataCy, getAllByDataCy, findByDataCy, findByText } = render(
  //     <OverlayCommentsWrapper refId="0">
  //       <div style={{ height: 100, width: 100 }} />
  //     </OverlayCommentsWrapper>,
  //     container,
  //   );
  //   // clicking creates a new unpublished comment
  //   userEvent.click(getByDataCy("overlay-comments-wrapper"));
  //   userEvent.type(getByDataCy("add-comment-input"), "new comment");
  //   // wait for text change to be propogated
  //   await findByText("new comment");
  //   userEvent.click(getByDataCy("add-comment-submit"));
  //   const createdThreadId = createNewThreadMockResponse.data.id;
  //   // wait for the new thread to be rendered
  //   await findByDataCy(`t--inline-comment-pin-trigger-${createdThreadId}`);
  //   const commentPins = getAllByDataCy("inline-comment-pin");
  //   // now we should have 9 threads rendered
  //   expect(commentPins).toHaveLength(9);
  //   done();
  // });
  // it("accept replies", async (done) => {
  //   const { getByDataCy, findByText, findByDataCy } = render(
  //     <OverlayCommentsWrapper refId="0">
  //       <div style={{ height: 100, width: 100 }} />
  //     </OverlayCommentsWrapper>,
  //     container,
  //   );
  //   const existingThreadId = fetchApplicationThreadsMockResponse.data[0].id;
  //   // show comment thread popover
  //   userEvent.click(
  //     getByDataCy(`t--inline-comment-pin-trigger-${existingThreadId}`),
  //   );
  //   userEvent.type(getByDataCy("add-comment-input"), "new");
  //   // wait for text change to be propogated
  //   await findByText("new");
  //   // mockAddCommentToThread();
  //   userEvent.click(getByDataCy("add-comment-submit"));
  //   // newly created comment should be visible
  //   const createdCommentId = addCommentToThreadMockResponse.data.id;
  //   await findByDataCy(`t--comment-card-${createdCommentId}`);
  //   done();
  // });

  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
    store.dispatch(resetEditorSuccess());
    // close any open comment thread popovers
    userEvent.keyboard("{esc}");
  });
});
