import { runSaga } from "redux-saga";
import type { Saga } from "redux-saga";

import ActionAPI from "api/ActionAPI";
import { PostgresFactory } from "test/factories/Actions/Postgres";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";
import { JSObjectFactory } from "test/factories/Actions/JSObject";
// Since this is a ce test, importing from @appsmith might lead to unexpected results
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import JSActionAPI from "ce/api/JSActionAPI";
import {
  updateActionAPICall,
  updateJSCollectionAPICall,
} from "./ApiCallerSagas";

jest.mock("ce/api/JSActionAPI");
jest.mock("api/ActionAPI");

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const successResponse = <T = any>(data: T) => {
  return {
    responseMeta: {
      status: 200,
      success: true,
    },
    data,
    errorDisplay: "",
  } as ApiResponse<T>;
};

describe("updateActionAPICall", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should call ActionAPI.updateAction and return the response", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatchedActions: any[] = [];
    const action = PostgresFactory.build();

    const response: ApiResponse<Action> = successResponse(action);

    (ActionAPI.updateAction as jest.Mock).mockResolvedValue(response);

    const result = await runSaga(
      {
        dispatch: (action) => dispatchedActions.push(action),
      },
      updateActionAPICall as Saga,
      action,
    ).toPromise();

    expect(ActionAPI.updateAction).toHaveBeenCalledWith(action);
    expect(result).toEqual(response);
  });

  it("should throw an error when ActionAPI.updateAction fails", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatchedActions: any[] = [];
    const action = PostgresFactory.build();
    const error = new Error("Some error");

    (ActionAPI.updateAction as jest.Mock).mockRejectedValue(error);

    try {
      await runSaga(
        {
          dispatch: (action) => dispatchedActions.push(action),
        },
        updateActionAPICall as Saga,
        action,
      ).toPromise();
    } catch (e) {
      expect(e).toEqual(error);
    }

    expect(ActionAPI.updateAction).toHaveBeenCalledWith(action);
  });
});

describe("updateJSCollectionAPICall", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should call JSActionAPI.updateJSCollection and return the response", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatchedActions: any[] = [];
    const jsCollection = JSObjectFactory.build();
    const response = successResponse(jsCollection);

    (JSActionAPI.updateJSCollection as jest.Mock).mockResolvedValue(response);

    const result = await runSaga(
      {
        dispatch: (action) => dispatchedActions.push(action),
      },
      updateJSCollectionAPICall as Saga,
      jsCollection,
    ).toPromise();

    expect(JSActionAPI.updateJSCollection).toHaveBeenCalledWith(jsCollection);
    expect(result).toEqual(response);
  });

  it("should throw an error when JSActionAPI.updateJSCollection fails", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatchedActions: any[] = [];
    const jsCollection = JSObjectFactory.build();
    const error = new Error("Some error");

    (JSActionAPI.updateJSCollection as jest.Mock).mockRejectedValue(error);

    try {
      await runSaga(
        {
          dispatch: (action) => dispatchedActions.push(action),
        },
        updateJSCollectionAPICall as Saga,
        jsCollection,
      ).toPromise();
    } catch (e) {
      expect(e).toEqual(error);
    }

    expect(JSActionAPI.updateJSCollection).toHaveBeenCalledWith(jsCollection);
  });
});
