import { getAffectedJSObjectIdsFromAction } from "./EvaluationsSagaUtils";
import {
  copyJSCollectionSuccess,
  createJSCollectionSuccess,
  deleteJSCollectionSuccess,
  fetchJSCollectionsForPageSuccess,
  moveJSCollectionSuccess,
} from "actions/jsActionActions";
import { updateJSCollectionBodySuccess } from "actions/jsPaneActions";
import type { JSCollection } from "entities/JSCollection";
import type {
  BufferedReduxAction,
  ReduxAction,
} from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";

describe("getAffectedJSObjectIdsFromAction", () => {
  const jsObject1 = { id: "1234" } as JSCollection;
  const jsObject2 = { id: "5678" } as JSCollection;
  const jsCollection: JSCollection[] = [jsObject1, jsObject2];

  test("should return a default response for an empty action ", () => {
    const result = getAffectedJSObjectIdsFromAction(
      null as unknown as ReduxAction<unknown>,
    );
    expect(result).toEqual({ ids: [], isAllAffected: false });
  });
  test("should return a default response for a non JS action and non Buffered redux action ", () => {
    const action: ReduxAction<unknown> = {
      type: ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS,
      payload: {},
    };
    const result = getAffectedJSObjectIdsFromAction(action);
    expect(result).toEqual({ ids: [], isAllAffected: false });
  });

  describe("infer correct affected action ids for a Buffered Redux Action", () => {
    test("should return an empty ids when there are no affectedJSObjects in the Buffered action", () => {
      const action: ReduxAction<unknown> = {
        type: ReduxActionTypes.BUFFERED_ACTION,
        payload: {},
      };
      const result = getAffectedJSObjectIdsFromAction(action);
      expect(result).toEqual({ ids: [], isAllAffected: false });
    });
    test("should return the buffered action's ids ", () => {
      const action: BufferedReduxAction<unknown> = {
        type: ReduxActionTypes.BUFFERED_ACTION,
        affectedJSObjects: { ids: ["1234", "5678"], isAllAffected: false },
        payload: {},
      };
      const result = getAffectedJSObjectIdsFromAction(action);
      expect(result).toEqual({ ids: ["1234", "5678"], isAllAffected: false });
    });
    test("should return the buffered action's isAllAffected property", () => {
      const action: BufferedReduxAction<unknown> = {
        type: ReduxActionTypes.BUFFERED_ACTION,
        affectedJSObjects: { ids: [], isAllAffected: true },
        payload: {},
      };
      const result = getAffectedJSObjectIdsFromAction(action);
      expect(result).toEqual({ isAllAffected: true, ids: [] });
    });
  });

  test.each([
    [createJSCollectionSuccess, jsObject1, ["1234"]],
    [deleteJSCollectionSuccess, jsObject1, ["1234"]],
    [copyJSCollectionSuccess, jsObject1, ["1234"]],
    [moveJSCollectionSuccess, jsObject1, ["1234"]],
    [updateJSCollectionBodySuccess, { data: jsObject1 }, ["1234"]],
    [fetchJSCollectionsForPageSuccess, jsCollection, ["1234", "5678"]],
  ])(
    "should return the correct affected JSObject ids for action %p with input %p and expected to be %p",
    (action, input, expected) => {
      const result = getAffectedJSObjectIdsFromAction(
        action(input as JSCollection & JSCollection[] & { data: JSCollection }),
      );
      expect(result).toEqual({ ids: expected, isAllAffected: false });
    },
  );
  test("should return isAllAffected to be true when there are JS errors", () => {
    [
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
    ].forEach((actionType) => {
      const result = getAffectedJSObjectIdsFromAction({
        type: actionType,
      } as ReduxAction<unknown>);
      expect(result).toEqual({ isAllAffected: true, ids: [] });
    });
  });
});
