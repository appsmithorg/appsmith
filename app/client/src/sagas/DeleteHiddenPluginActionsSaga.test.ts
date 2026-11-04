import { runSaga, type Saga } from "redux-saga";
import { call, delay, put } from "redux-saga/effects";
import { toast } from "@appsmith/ads";
import DatasourcesApi from "ee/api/DatasourcesApi";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { deleteHiddenPluginActions } from "actions/pluginActionActions";
import { deleteActionSaga } from "./ActionSagas";
import { deleteHiddenPluginActionsSaga } from "./DeleteHiddenPluginActionsSaga";

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  toast: { show: jest.fn() },
}));
jest.mock("./ActionSagas", () => ({ deleteActionSaga: jest.fn() }));
jest.mock("./ErrorSagas", () => ({
  validateResponse: jest.fn(function* (response: { ok: boolean }) {
    return response.ok;
  }),
}));
jest.mock("ee/api/DatasourcesApi", () => ({
  __esModule: true,
  default: { deleteDatasource: jest.fn() },
}));

describe("deleteHiddenPluginActionsSaga", () => {
  let actionIds: string[];
  let events: string[];
  let dispatched: Array<{ type: string; payload?: unknown }>;

  beforeEach(() => {
    jest.clearAllMocks();
    actionIds = ["q1", "q2", "q3"];
    events = [];
    dispatched = [];

    // Each delete takes a moment, removes the query from the store, and
    // records when it starts and ends. "q3" fails, like a server error.
    (deleteActionSaga as unknown as jest.Mock).mockImplementation(
      function* (action: { payload: { id: string } }) {
        const { id } = action.payload;

        events.push(`start ${id}`);
        yield delay(5);

        if (id !== "q3") actionIds = actionIds.filter((a) => a !== id);

        events.push(`end ${id}`);
      },
    );

    // ds-1 is unused and deletable. ds-2 is still used elsewhere: the server
    // refuses. ds-3 returns an invalid response.
    (DatasourcesApi.deleteDatasource as jest.Mock).mockImplementation(
      async (id: string) => {
        if (id === "ds-2") throw new Error("DATASOURCE_HAS_ACTIONS");

        return { ok: id === "ds-1", data: { id } };
      },
    );
  });

  const run = async (onComplete = jest.fn()) => {
    await runSaga(
      {
        dispatch: (action: { type: string; payload?: unknown }) => {
          dispatched.push(action);
        },
        getState: () => ({
          entities: {
            actions: actionIds.map((id) => ({ config: { id } })),
          },
        }),
      },
      deleteHiddenPluginActionsSaga as unknown as Saga,
      deleteHiddenPluginActions({
        actions: [
          { id: "q1", name: "Q1" },
          { id: "q2", name: "Q2" },
          { id: "q3", name: "Q3" },
        ],
        datasourceIds: ["ds-1", "ds-2", "ds-3"],
        onComplete,
      }),
    ).toPromise();

    return onComplete;
  };

  it("deletes queries one at a time, through the normal delete saga", async () => {
    await run();

    expect(events).toEqual([
      "start q1",
      "end q1",
      "start q2",
      "end q2",
      "start q3",
      "end q3",
    ]);
    expect(deleteActionSaga).toHaveBeenCalledWith({
      type: ReduxActionTypes.DELETE_ACTION_INIT,
      payload: { id: "q1", name: "Q1" },
    });
  });

  it("removes only the datasources the server deleted, and hides refusals", async () => {
    await run();

    const datasourceSuccesses = dispatched.filter(
      (action) => action.type === ReduxActionTypes.DELETE_DATASOURCE_SUCCESS,
    );

    expect(DatasourcesApi.deleteDatasource).toHaveBeenCalledTimes(3);
    expect(datasourceSuccesses).toEqual([
      {
        type: ReduxActionTypes.DELETE_DATASOURCE_SUCCESS,
        payload: { id: "ds-1" },
      },
    ]);
  });

  it("reports the number of queries actually removed", async () => {
    const onComplete = await run();

    expect(onComplete).toHaveBeenCalledWith(2);
    expect(toast.show).toHaveBeenCalledWith("Deleted 2 Appsmith AI queries.", {
      kind: "success",
    });
  });

  it("shows no success message when nothing was removed", async () => {
    (deleteActionSaga as unknown as jest.Mock).mockImplementation(function* () {
      yield put({ type: "NOOP" });
      yield call(() => undefined);
    });

    const onComplete = await run();

    expect(onComplete).toHaveBeenCalledWith(0);
    expect(toast.show).not.toHaveBeenCalled();
  });
});
