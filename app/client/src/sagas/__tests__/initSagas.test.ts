import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";
import { APP_MODE } from "entities/App";
import AppEngineFactory from "entities/Engine/factory";
import { getInitResponses } from "sagas/InitSagas";
import { startAppEngine } from "sagas/InitSagas";
import type { AppEnginePayload } from "entities/Engine";
import { testSaga } from "redux-saga-test-plan";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import mockResponse from "./mockConsolidatedApiResponse.json";
import { startRootSpan } from "instrumentation/generateTraces";

jest.mock("../../api/Api", () => ({
  __esModule: true,
  default: class Api {},
}));

// Mock the entire AppEngineFactory module
jest.mock("entities/Engine/factory", () => ({
  __esModule: true,

  default: class AppEngineFactory {
    static create = jest.fn();
  },
}));

describe("tests the sagas in initSagas", () => {
  const pageId = "pageId";
  const basePageId = "basePageId";
  const action: ReduxAction<AppEnginePayload> = {
    type: ReduxActionTypes.INITIALIZE_EDITOR,
    payload: {
      mode: APP_MODE.EDIT,
      basePageId: basePageId,
      applicationId: "applicationId",
    },
  };

  it("tests the order of execute in startAppEngine", () => {
    const engine = {
      startPerformanceTracking: jest.fn(),
      setupEngine: jest.fn(),
      loadAppData: jest.fn().mockResolvedValue({
        applicationId: action.payload.applicationId,
        toLoadPageId: pageId,
        toLoadBasePageId: action.payload.basePageId,
      }),
      loadAppURL: jest.fn(),
      loadAppEntities: jest.fn(),
      loadGit: jest.fn(),
      completeChore: jest.fn(),
      stopPerformanceTracking: jest.fn(),
    };

    const mockRootSpan = startRootSpan("startAppEngine");

    (AppEngineFactory.create as jest.Mock).mockReturnValue(engine);

    testSaga(startAppEngine, action)
      .next()
      .call(engine.setupEngine, action.payload, mockRootSpan)
      .next()
      .call(getInitResponses, { ...action.payload })
      .next(mockResponse.data)
      .put({ type: ReduxActionTypes.LINT_SETUP })
      .next()
      .call(engine.loadAppData, action.payload, mockResponse.data, mockRootSpan)
      .next({
        applicationId: action.payload.applicationId,
        toLoadPageId: pageId,
        toLoadBasePageId: basePageId,
      })
      .call(engine.loadAppURL, {
        basePageId: action.payload.basePageId,
        basePageIdInUrl: action.payload.basePageId,
        rootSpan: mockRootSpan,
      })
      .next()
      .call(
        engine.loadAppEntities,
        pageId,
        action.payload.applicationId,
        mockResponse.data,
        mockRootSpan,
      )
      .next()
      .call(engine.loadGit, action.payload.applicationId, mockRootSpan)
      .next()
      .call(engine.completeChore, mockRootSpan)
      .next()
      .put(generateAutoHeightLayoutTreeAction(true, false))
      .next()
      .isDone();
  });
});
