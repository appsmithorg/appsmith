import React from "react";
import userEvent from "@testing-library/user-event";
import { unmountComponentAtNode } from "react-dom";
import OverlayCommentsWrapper from "../inlineComments/OverlayCommentsWrapper";
import store from "store";
import { createEvent, fireEvent, render, waitFor } from "test/testUtils";
import { fetchApplicationCommentsRequest } from "actions/commentActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { setCommentMode } from "actions/commentActions";
import { resetEditorSuccess } from "actions/initActions";
import setMockPages from "./setMockPages";
import {
  createNewThreadMockResponse,
  fetchApplicationThreadsMockResponse,
  addCommentToThreadMockResponse,
} from "mockResponses/CommentApiMockResponse";
import { act } from "react-dom/test-utils";
import { uniqueId } from "lodash";

let container: any = null;
describe("Comment threads", () => {
  beforeEach(async () => {
    (window as any).isCommentModeForced = true;
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
      <OverlayCommentsWrapper refId="0" widgetType={"BUTTON_WIDGET"}>
        <div style={{ height: 100, width: 100 }} />
      </OverlayCommentsWrapper>,
      container,
    );
    const commentPins = await findAllByDataCy("inline-comment-pin");
    expect(commentPins).toHaveLength(8);
    done();
  });

  it("can be created", async (done) => {
    const { findByDataCy, findByText, getAllByDataCy, getByDataCy } = render(
      <OverlayCommentsWrapper refId="0" widgetType={"BUTTON_WIDGET"}>
        <div style={{ height: 100, width: 100 }} />
      </OverlayCommentsWrapper>,
      container,
    );
    // clicking creates a new unpublished comment
    userEvent.click(getByDataCy("overlay-comments-wrapper"));
    const textAreas = await waitFor(() =>
      document.querySelectorAll(".public-DraftEditor-content"),
    );
    const textArea = textAreas[textAreas.length - 1];
    expect(textArea).toBeTruthy();

    if (textArea) {
      const newComment = uniqueId();
      const event = createEvent.paste(textArea, {
        clipboardData: {
          types: ["text/plain"],
          getData: () => newComment,
        },
      });
      act(() => {
        fireEvent(textArea, event);
      });
      // wait for text change to be propogated
      await findByText(newComment);
      userEvent.click(getByDataCy("add-comment-submit"));
      const createdThreadId = createNewThreadMockResponse.data.id;
      // wait for the new thread to be rendered
      await findByDataCy(`t--inline-comment-pin-trigger-${createdThreadId}`);
      const commentPins = getAllByDataCy("inline-comment-pin");
      // now we should have 9 threads rendered
      expect(commentPins).toHaveLength(9);
    }
    done();
  });
  it("accept replies", async (done) => {
    const { findByDataCy, findByText, getByDataCy } = render(
      <OverlayCommentsWrapper refId="0" widgetType={"BUTTON_WIDGET"}>
        <div style={{ height: 100, width: 100 }} />
      </OverlayCommentsWrapper>,
      container,
    );
    const existingThreadId = fetchApplicationThreadsMockResponse.data[0].id;
    const pin = await findByDataCy(
      `t--inline-comment-pin-trigger-${existingThreadId}`,
    );
    // show comment thread popover
    userEvent.click(pin);

    const textAreas = await waitFor(() =>
      document.querySelectorAll(".public-DraftEditor-content"),
    );
    const textArea = textAreas[textAreas.length - 1];
    expect(textArea).toBeTruthy();

    if (textArea) {
      const event = createEvent.paste(textArea, {
        clipboardData: {
          types: ["text/plain"],
          getData: () => "new",
        },
      });
      fireEvent(textArea, event);
      // wait for text change to be propogated
      await findByText("new");
      userEvent.click(getByDataCy("add-comment-submit"));
      // newly created comment should be visible
      const createdCommentId = addCommentToThreadMockResponse.data.id;
      await findByDataCy(`t--comment-card-${createdCommentId}`);
    }
    done();
  });

  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
    store.dispatch(resetEditorSuccess());
    // close any open comment thread popovers
    userEvent.keyboard("{esc}");
    (window as any).isCommentModeForced = false;
  });
});
