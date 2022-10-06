import {
  addMessageHandlerSaga,
  addExecuteMessageHandler,
} from "./AddMessageHandlerSaga";
import { spawn } from "redux-saga/effects";
import { runSaga } from "redux-saga";

describe("MessageHandlerSaga", () => {
  describe("messageHandlerSaga function", () => {
    const generator = addMessageHandlerSaga(
      {
        handler: (event: MessageEvent) => {
          return;
        },
      },
      {},
    );

    it("executes messageHandlerSaga with the payload and trigger meta", () => {
      expect(generator.next().value).toStrictEqual(
        spawn(
          addExecuteMessageHandler,
          {
            handler: (event: MessageEvent) => {
              return;
            },
          },
          {},
        ),
      );
    });

    it("should be done on next iteration", () => {
      expect(generator.next().done).toBeTruthy();
    });
  });

  describe("executeMessageHandler function", () => {
    it("calls window.addEventListener with message handler", () => {
      const dispatched: any[] = [];

      const messageHandler = jest.spyOn(window, "addEventListener");

      runSaga(
        {
          dispatch: (action) => dispatched.push(action),
        },
        addExecuteMessageHandler,
        {
          handler: (event: MessageEvent) => {
            return;
          },
        },
        {},
      );

      expect(messageHandler).toHaveBeenCalledWith(
        "message",
        (event: MessageEvent) => {
          return;
        },
      );

      expect(dispatched).toEqual([]);
    });
  });
});
