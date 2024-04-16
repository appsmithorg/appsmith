import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import type AppEngine from "entities/Engine";
import AppEngineFactory from "entities/Engine/factory";
import { call } from "redux-saga/effects";
import { getInitResponses } from "sagas/InitSagas";
import { startAppEngine } from "sagas/InitSagas";
import mockResponse from "./mockConsolidatedApiResponse.json";

jest.mock("../../api/Api", () => ({
  __esModule: true,
  default: class Api {},
}));

describe("tests the sagas in initSagas", () => {
  it("tests the order of execute in startAppEngine", () => {
    const action = {
      type: ReduxActionTypes.INITIALIZE_EDITOR,
      payload: {
        applicationId: "applicationId",
        pageId: "pageId",
        mode: APP_MODE.EDIT,
        branch: "",
      },
    };
    const gen = startAppEngine(action);

    const engine: AppEngine = AppEngineFactory.create(
      APP_MODE.EDIT,
      APP_MODE.EDIT,
    );
    expect(JSON.stringify(gen.next().value)).toStrictEqual(
      JSON.stringify(call(engine.setupEngine, action.payload)),
    );
    expect(gen.next().value).toStrictEqual(
      call(getInitResponses, action.payload),
    );

    expect(JSON.stringify(gen.next(mockResponse as any).value)).toStrictEqual(
      JSON.stringify(
        call(engine.loadAppData, action.payload, mockResponse as any),
      ),
    );
    expect(
      JSON.stringify(
        gen.next({
          applicationId: action.payload.applicationId,
          toLoadPageId: action.payload.pageId,
        } as any).value,
      ),
    ).toStrictEqual(
      JSON.stringify(
        call(engine.loadAppURL, action.payload.pageId, action.payload.pageId),
      ),
    );
    expect(JSON.stringify(gen.next().value)).toStrictEqual(
      JSON.stringify(
        call(
          engine.loadAppEntities,
          action.payload.pageId,
          action.payload.applicationId,
          mockResponse as any,
        ),
      ),
    );
    expect(JSON.stringify(gen.next().value)).toStrictEqual(
      JSON.stringify(call(engine.loadGit, action.payload.applicationId)),
    );
    expect(JSON.stringify(gen.next().value)).toStrictEqual(
      JSON.stringify(call(engine.completeChore)),
    );
  });
});
