import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import AppEngine from "entities/Engine";
import AppEngineFactory from "entities/Engine/factory";
import { call } from "redux-saga/effects";
import { startAppEngine } from "sagas/InitSagas";

describe("tests the sagas in initSagas", () => {
  it("tests the order of execute in startAppEngine", () => {
    const action = {
      type: ReduxActionTypes.INITIALIZE_EDITOR,
      payload: {
        applicationId: "appId",
        pageId: "pageId",
        mode: APP_MODE.EDIT,
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
    expect(JSON.stringify(gen.next().value)).toStrictEqual(
      JSON.stringify(call(engine.loadAppData, action.payload)),
    );
    expect(
      JSON.stringify(
        gen.next({
          applicationId: action.payload.applicationId,
          toLoadPageId: action.payload.pageId,
        }).value,
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
