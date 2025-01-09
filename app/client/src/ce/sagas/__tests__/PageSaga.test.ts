import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { testSaga } from "redux-saga-test-plan";
import { setupPageSaga, setupPublishedPageSaga } from "../PageSagas";
import mockResponse from "./mockConsolidatedApiResponse.json";
import type { FetchPageResponse } from "api/PageApi";
import {
  fetchPageAction,
  fetchPublishedPageAction,
  type SetupPageActionPayload,
  type SetupPublishedPageActionPayload,
} from "actions/pageActions";

describe("ce/PageSaga", () => {
  it("should put setupPageSaga with pageWithMigratedDsl", () => {
    const action: ReduxAction<SetupPageActionPayload> = {
      type: ReduxActionTypes.SETUP_PAGE_INIT,
      payload: {
        id: "pageId",
        pageWithMigratedDsl: mockResponse.data
          .pageWithMigratedDsl as FetchPageResponse,
      },
    };

    testSaga(setupPageSaga, action)
      .next()
      .put(
        fetchPageAction(
          action.payload.id,
          action.payload.isFirstLoad,
          action.payload.pageWithMigratedDsl,
        ),
      )
      .next()
      .take(ReduxActionTypes.FETCH_PAGE_SUCCESS)
      .next()
      .put({ type: ReduxActionTypes.SETUP_PAGE_SUCCESS })
      .next()
      .isDone();
  });

  it("should put setupPublishedPageSaga with pageWithMigratedDsl", () => {
    const action: ReduxAction<SetupPublishedPageActionPayload> = {
      type: ReduxActionTypes.SETUP_PAGE_INIT,
      payload: {
        pageId: "pageId",
        pageWithMigratedDsl: mockResponse.data
          .pageWithMigratedDsl as FetchPageResponse,
        bustCache: false,
      },
    };

    testSaga(setupPublishedPageSaga, action)
      .next()
      .put(
        fetchPublishedPageAction(
          action.payload.pageId,
          action.payload.bustCache,
          action.payload.pageWithMigratedDsl,
        ),
      )
      .next()
      .take(ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS)
      .next()
      .put({ type: ReduxActionTypes.SETUP_PUBLISHED_PAGE_SUCCESS })
      .next()
      .isDone();
  });
});
