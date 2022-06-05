import { failFastApiCalls } from "./utils";
import { put, all, take, race } from "redux-saga/effects";
// import { runSaga } from "redux-saga";

// function* fakeFetchPublishedPageSaga(action: {
//   payload: { shouldFail: boolean };
// }) {
//   try {
//     if (action && action.payload.shouldFail) {
//       throw Error("fakeFetchPublishedPageSaga failed");
//     }
//     // dispatch fetch page success
//     yield put({ type: "FAKE_FETCH_PUBLISHED_PAGE_SUCCESS" });
//   } catch (error) {
//     yield put({
//       type: "FAKE_FETCH_PUBLISHED_PAGE_ERROR",
//       payload: {
//         error,
//       },
//     });
//   }
// }

const fakeApiCall = (id: string) => ({
  type: "FAKE_API_CALL_INIT",
  payload: {
    id,
  },
});

describe("Test failFastApiCalls", () => {
  it("test failFastApiCalls order of execution", async () => {
    const generator = failFastApiCalls(
      [fakeApiCall("randomPage1"), fakeApiCall("randomPage2")],
      ["FAKE_API_CALL_SUCCESS", "FAKE_API_CALL_SUCCESS"],
      ["FAKE_API_CALL_ERROR", "FAKE_API_CALL_ERROR"],
    );
    const triggerAllEffects = generator.next().value;

    expect(triggerAllEffects).toStrictEqual(
      all([put(fakeApiCall("randomPage1")), put(fakeApiCall("randomPage2"))]),
    );

    const effectRaceResult = generator.next().value;

    expect(effectRaceResult).toStrictEqual(
      race({
        success: all(
          [
            "FAKE_API_CALL_SUCCESS",
            "FAKE_API_CALL_SUCCESS",
          ].map((successAction) => take(successAction)),
        ),
        failure: take(["FAKE_API_CALL_ERROR", "FAKE_API_CALL_ERROR"]),
      }),
    );
  });

  // it.skip("test failFastApiCalls functionality", async () => {
  //   const dispatchedActions: Array<unknown> = [];

  //   await all([
  //     takeEvery("FAKE_FETCH_PUBLISHED_PAGE_INIT", fakeFetchPublishedPageSaga),
  //   ]);

  //   const result = await runSaga(
  //     {
  //       dispatch: (action) => dispatchedActions.push(action),
  //       getState: () => ({ value: "test" }),
  //     },
  //     failFastApiCalls,
  //     [{ type: "FAKE_FETCH_PUBLISHED_PAGE_INIT", payload: true }],
  //     ["FAKE_FETCH_PUBLISHED_PAGE_SUCCESS"],
  //     ["FAKE_FETCH_PUBLISHED_PAGE_ERROR"],
  //   );

  //   console.log(dispatchedActions, result.isRunning());
  // });
});
