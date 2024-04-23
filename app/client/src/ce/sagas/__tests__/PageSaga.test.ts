import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { testSaga } from "redux-saga-test-plan";
import { setupPageSaga, setupPublishedPageSaga } from "../PageSagas";
import mockResponse from "./mockConsolidatedApiResponse.json";
import type { FetchPageRequest, FetchPageResponse } from "api/PageApi";
import { fetchPage, fetchPublishedPage } from "actions/pageActions";

describe("ce/PageSaga", () => {
  it("should put setupPageSaga with pageWithMigratedDsl", () => {
    const action: ReduxAction<FetchPageRequest> = {
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
        fetchPage(
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
    const action: ReduxAction<{
      pageId: string;
      bustCache: boolean;
      firstLoad: boolean;
      pageWithMigratedDsl?: FetchPageResponse;
    }> = {
      type: ReduxActionTypes.SETUP_PAGE_INIT,
      payload: {
        pageId: "pageId",
        pageWithMigratedDsl: mockResponse.data
          .pageWithMigratedDsl as FetchPageResponse,
        bustCache: false,
        firstLoad: true,
      },
    };

    testSaga(setupPublishedPageSaga, action)
      .next()
      .put(
        fetchPublishedPage(
          action.payload.pageId,
          action.payload.bustCache,
          action.payload.firstLoad,
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
