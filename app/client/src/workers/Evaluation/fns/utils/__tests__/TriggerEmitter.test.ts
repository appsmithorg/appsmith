const pingMock = jest.fn();
jest.mock("../Messenger.ts", () => ({
  ...jest.requireActual("../Messenger.ts"),
  get WorkerMessenger() {
    return {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ping: (...args: any) => {
        pingMock(JSON.stringify(args[0]));
      },
    };
  },
}));

import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import TriggerEmitter, { BatchKey } from "../TriggerEmitter";

describe("Tests all trigger events", () => {
  it("Should invoke the right callback", () => {
    const callback = jest.fn();
    TriggerEmitter.on("test", callback);
    TriggerEmitter.emit("test", "test");
    expect(callback).toBeCalledWith("test");
    TriggerEmitter.removeListener("test", callback);
  });

  it("show batch events of key process_store_updates", async () => {
    const payload1 = {
      type: "STORE_VALUE",
      payload: {
        name: "test",
        value: "test",
        persist: true,
      },
    };
    const payload2 = {
      type: "REMOVE_VALUE",
      payload: {
        name: "test",
      },
    };
    const payload3 = {
      type: "CLEAR_STORE",
      payload: {},
    };
    TriggerEmitter.emit(BatchKey.process_store_updates, payload1);
    TriggerEmitter.emit(BatchKey.process_store_updates, payload2);
    TriggerEmitter.emit(BatchKey.process_store_updates, payload3);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(pingMock).toBeCalledTimes(1);
    expect(pingMock).toBeCalledWith(
      JSON.stringify({
        method: MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES,
        data: [payload1, payload2, payload3],
      }),
    );
    pingMock.mockClear();
  });

  it("it should call store updates(priority) before logs(deferred)", async () => {
    const payload1 = {
      data: {
        data: "log",
      },
    };
    const payload2 = {
      type: "STORE_VALUE",
      payload: {
        name: "test",
        value: "test",
        persist: true,
      },
    };
    TriggerEmitter.emit(BatchKey.process_logs, payload1);
    TriggerEmitter.emit(BatchKey.process_logs, payload1);
    TriggerEmitter.emit(BatchKey.process_logs, payload1);
    TriggerEmitter.emit(BatchKey.process_store_updates, payload2);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(pingMock).toBeCalledTimes(2);
    const args = pingMock.mock.calls;
    expect(args[0][0]).toBe(
      JSON.stringify({
        method: MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES,
        data: [payload2],
      }),
    );
    expect(args[1][0]).toBe(
      JSON.stringify({
        method: MAIN_THREAD_ACTION.PROCESS_LOGS,
        data: [payload1, payload1, payload1],
      }),
    );
    pingMock.mockClear();
  });
});
