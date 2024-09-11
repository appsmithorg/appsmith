import { GracefulWorkerService } from "./WorkerUtil";
import { runSaga } from "redux-saga";

const MessageType = "message";
interface extraWorkerProperties {
  callback: CallableFunction;
  noop: CallableFunction;
  delayMilliSeconds: number;
  running: boolean;
}
type WorkerClass = Worker & extraWorkerProperties;
class MockWorkerClass implements WorkerClass {
  // Implement interface
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onmessage: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onmessageerror: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatchEvent: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: any;

  callback: CallableFunction;
  noop: CallableFunction;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Array<any>;
  delayMilliSeconds: number;
  instance: WorkerClass | undefined;
  responses: Set<number>;
  running: boolean;

  resetInstance() {
    this.instance = undefined;
  }

  constructor() {
    /* eslint-disable @typescript-eslint/no-empty-function */
    this.noop = () => {};
    this.callback = this.noop;
    this.messages = [];
    this.delayMilliSeconds = 0;
    this.responses = new Set<number>();
    this.instance = this;
    this.running = true;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener(msgType: string, callback: any) {
    expect(msgType).toEqual(MessageType);
    this.callback = callback;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeEventListener(msgType: string, callback: any) {
    expect(msgType).toEqual(MessageType);
    expect(callback).toEqual(this.callback);
    this.callback = this.noop;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage(message: any) {
    expect(this.running).toEqual(true);
    expect(this.callback).not.toEqual(this.noop);
    this.messages.push(message);
    const counter = setTimeout(() => {
      const response = {
        messageId: message.messageId,
        messageType: "RESPONSE",
        body: { data: message.body.data },
      };
      this.sendEvent({ data: response });
      this.responses.delete(counter);
    }, this.delayMilliSeconds);
    this.responses.add(counter);
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendEvent(ev: any) {
    expect(this.running).toEqual(true);
    expect(this.callback).not.toEqual(this.noop);
    this.callback(ev);
  }

  terminate() {
    this.running = false;
    expect(this.callback).toEqual(this.noop);
    this.responses.forEach((counter) => {
      clearTimeout(counter);
    });
    this.responses = new Set<number>();
  }
}

describe("GracefulWorkerService", () => {
  test("Worker should start", async () => {
    const MockWorker = new MockWorkerClass();
    const w = new GracefulWorkerService(MockWorker);

    // wait for worker to start
    await runSaga({}, w.start);
    if (MockWorker.instance === undefined) {
      expect(MockWorker.instance).toBeDefined();
      return;
    }
    expect(MockWorker.instance.callback).not.toEqual(MockWorker.instance.noop);
  });

  test("Independent requests should respond independently irrespective of order", async () => {
    const MockWorker = new MockWorkerClass();
    const w = new GracefulWorkerService(MockWorker);
    await runSaga({}, w.start);
    const message1 = { tree: "hello" };
    const message2 = { tree: "world" };
    // Send requests in order
    const result1 = await runSaga({}, w.request, "test", message1);
    const result2 = await runSaga({}, w.request, "test", message2);
    // wait for responses out of order
    const resp2 = await result2.toPromise();
    const resp1 = await result1.toPromise();
    expect(resp1).toEqual(message1);
    expect(resp2).toEqual(message2);
  });

  test("Request should wait for ready", async () => {
    const MockWorker = new MockWorkerClass();
    const w = new GracefulWorkerService(MockWorker);
    const message = { hello: "world" };
    // Send a request before starting
    const result = await runSaga({}, w.request, "test", message);
    // trigger start after the worker is already waiting
    runSaga({}, w.start);
    const resp = await result.toPromise();
    expect(resp).toEqual(message);
  });

  test("Worker should wait to drain in-flight requests before shutdown", async () => {
    const MockWorker = new MockWorkerClass();
    const w = new GracefulWorkerService(MockWorker);
    const message = { hello: "world" };
    await runSaga({}, w.start);
    const start = performance.now();
    // Need this to work with eslint
    if (MockWorker.instance === undefined) {
      expect(MockWorker.instance).toBeDefined();
      return;
    }
    // Typical run takes less than 10ms
    // we add a delay of 100ms to check if shutdown waited for pending requests.
    MockWorker.instance.delayMilliSeconds = 100;

    const result = await runSaga({}, w.request, "test", message);
    // wait for shutdown
    await (await runSaga({}, w.shutdown)).toPromise();
    // Shutdown shouldn't happen till we get a response
    expect(performance.now() - start).toBeGreaterThanOrEqual(
      MockWorker.instance.delayMilliSeconds,
    );
    const resp = await result.toPromise();
    expect(resp).toEqual(message);
  });

  test("Worker restart should work", async () => {
    const MockWorker = new MockWorkerClass();
    let w = new GracefulWorkerService(MockWorker);
    const message1 = { tree: "hello" };
    await runSaga({}, w.start);

    // Need this to work with eslint
    if (MockWorker.instance === undefined) {
      expect(MockWorker.instance).toBeDefined();
      return;
    }
    // Keep a reference to the old instance to check later
    const oldInstance = MockWorker.instance;
    const result1 = await runSaga({}, w.request, "test", message1);
    expect(await result1.toPromise()).toEqual(message1);
    // stop the worker
    await (await runSaga({}, w.shutdown)).toPromise();
    // Should have called terminate on worker
    expect(oldInstance.running).toEqual(false);

    // Send a message to the new worker before starting it
    const newMockWorker = new MockWorkerClass();
    w = new GracefulWorkerService(newMockWorker);
    const message2 = { tree: "world" };
    const result2 = await runSaga({}, w.request, "test", message2);

    await runSaga({}, w.start);

    // We should have a new instance of the worker
    expect(newMockWorker.instance).not.toEqual(oldInstance);
    // The new worker should get the correct message
    expect(await result2.toPromise()).toEqual(message2);
  });

  test("Cancelling saga before starting up should not crash", async () => {
    const MockWorker = new MockWorkerClass();
    const w = new GracefulWorkerService(MockWorker);
    const message = { tree: "hello" };

    const task = await runSaga({}, w.request, "cancel_test", message);
    // Start shutting down
    const shutdown = await runSaga({}, w.shutdown);
    task.cancel();
    // wait for shutdown
    await shutdown.toPromise();
    expect(await task.toPromise()).not.toEqual(message);
  });

  test("Cancelled saga should clean up", async () => {
    const MockWorker = new MockWorkerClass();
    const w = new GracefulWorkerService(MockWorker);
    const message = { tree: "hello" };
    await runSaga({}, w.start);

    // Need this to work with eslint
    if (MockWorker.instance === undefined) {
      expect(MockWorker.instance).toBeDefined();
      return;
    }
    // Make sure we get a chance to cancel before the worker can respond
    MockWorker.instance.delayMilliSeconds = 100;
    const task = await runSaga({}, w.request, "cancel_test", message);
    // Start shutting down
    const shutdown = await runSaga({}, w.shutdown);
    task.cancel();
    // wait for shutdown
    await shutdown.toPromise();
    expect(await task.toPromise()).not.toEqual(message);
  });
});
