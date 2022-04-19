import { postMessageSaga, executePostMessage } from "./PostMessageSaga";
import { spawn } from "redux-saga/effects";
import { runSaga } from "redux-saga";

describe("PostMessageSaga", () => {
  describe("postMessageSaga function", () => {
    const generator = postMessageSaga(
      {
        message: "hello world",
        targetOrigin: "https://dev.appsmith.com",
      },
      {},
    );

    it("executes postMessageSaga with the payload and trigger meta", () => {
      expect(generator.next().value).toStrictEqual(
        spawn(
          executePostMessage,
          {
            message: "hello world",
            targetOrigin: "https://dev.appsmith.com",
          },
          {},
        ),
      );
    });

    it("should be done on next iteration", () => {
      expect(generator.next().done).toBeTruthy();
    });
  });

  describe("executePostMessage function", () => {
    it("calls window.parent with message and target origin", () => {
      const dispatched: any[] = [];

      runSaga(
        {
          dispatch: (action) => dispatched.push(action),
        },
        executePostMessage,
        {
          message: "hello world",
          targetOrigin: "https://dev.appsmith.com",
        },
        {},
      );

      expect(window.parent.postMessage).toHaveBeenCalledWith(
        "hello world",
        "https://dev.appsmith.com",
        {},
      );

      expect(dispatched).toEqual(undefined);
    });
  });
});
