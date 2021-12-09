import { GracefulWorkerService } from "./WorkerUtil";
import { channel, runSaga } from "redux-saga";
import WebpackWorker from "worker-loader!";

const MessageType = "message";
class MockWorker implements WebpackWorker {
  // Implement interface
  onmessage: any;
  onmessageerror: any;
  dispatchEvent: any;
  onerror: any;

  callback: CallableFunction;
  noop: CallableFunction;
  messages: Array<any>;
  delayMilliSeconds: number;
  static instance: MockWorker | undefined;
  responses: Set<number>;
  running: boolean;

  static resetInstance() {
    MockWorker.instance = undefined;
  }

  constructor() {
    /* eslint-disable @typescript-eslint/no-empty-function */
    this.noop = () => {};
    this.callback = this.noop;
    this.messages = [];
    this.delayMilliSeconds = 0;
    this.responses = new Set<number>();
    MockWorker.instance = this;
    this.running = true;
  }

  addEventListener(msgType: string, callback: any) {
    expect(msgType).toEqual(MessageType);
    this.callback = callback;
  }

  removeEventListener(msgType: string, callback: any) {
    expect(msgType).toEqual(MessageType);
    expect(callback).toEqual(this.callback);
    this.callback = this.noop;
  }

  postMessage(message: any) {
    expect(this.running).toEqual(true);
    expect(this.callback).not.toEqual(this.noop);
    this.messages.push(message);
    const counter = setTimeout(() => {
      const response = {
        requestId: message.requestId,
        responseData: message.requestData,
      };
      this.sendEvent({ data: response });
      this.responses.delete(counter);
    }, this.delayMilliSeconds);
    this.responses.add(counter);
  }

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
  beforeEach(() => {
    MockWorker.resetInstance();
    // Assert we don't have an instance from before
    expect(MockWorker.instance).toBeUndefined();
  });

  test("Worker should start", async () => {
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
    const w = new GracefulWorkerService(MockWorker);
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
    const message2 = { tree: "world" };
    const result2 = await runSaga({}, w.request, "test", message2);

    await runSaga({}, w.start);

    // We should have a new instance of the worker
    expect(MockWorker.instance).not.toEqual(oldInstance);
    // The new worker should get the correct message
    expect(await result2.toPromise()).toEqual(message2);
  });

  test("Cancelling saga before starting up should not crash", async () => {
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

  test("duplex request starter", async () => {
    const w = new GracefulWorkerService(MockWorker);
    await runSaga({}, w.start);
    // Need this to work with eslint
    if (MockWorker.instance === undefined) {
      expect(MockWorker.instance).toBeDefined();
      return;
    }
    const requestData = { message: "Hello" };
    const method = "duplex_test";
    MockWorker.instance.postMessage = jest.fn();
    const duplexRequest = await runSaga(
      {},
      w.duplexRequest,
      method,
      requestData,
    );
    const handlers = await duplexRequest.toPromise();
    expect(handlers).toHaveProperty("requestChannel");
    expect(handlers).toHaveProperty("responseChannel");
    expect(MockWorker.instance.postMessage).toBeCalledWith({
      method,
      requestData,
      requestId: expect.stringContaining(method),
    });
  });

  test("duplex request channel handler", async () => {
    const w = new GracefulWorkerService(MockWorker);
    await runSaga({}, w.start);
    const mockChannel = (name = "mock") => ({
      name,
      take: jest.fn(),
      put: jest.fn(),
      flush: jest.fn(),
      close: jest.fn(),
    });
    const workerChannel = channel();
    const mockRequestChannel = mockChannel("request");
    const mockResponseChannel = mockChannel("response");
    runSaga(
      {},
      w.duplexRequestHandler,
      workerChannel,
      mockRequestChannel,
      mockResponseChannel,
    );

    let randomRequestCount = Math.floor(Math.random() * 10);

    for (randomRequestCount; randomRequestCount > 0; randomRequestCount--) {
      workerChannel.put({
        responseData: {
          test: randomRequestCount,
        },
      });
      expect(mockRequestChannel.put).toBeCalledWith({
        requestData: {
          test: randomRequestCount,
        },
      });
    }

    workerChannel.put({
      responseData: {
        finished: true,
      },
    });

    expect(mockResponseChannel.put).toBeCalledWith({ finished: true });

    expect(mockRequestChannel.close).toBeCalled();
  });

  test("duplex response channel handler", async () => {
    const w = new GracefulWorkerService(MockWorker);
    await runSaga({}, w.start);

    // Need this to work with eslint
    if (MockWorker.instance === undefined) {
      expect(MockWorker.instance).toBeDefined();
      return;
    }
    const mockChannel = (name = "mock") => ({
      name,
      take: jest.fn(),
      put: jest.fn(),
      flush: jest.fn(),
      close: jest.fn(),
    });
    const mockWorkerChannel = mockChannel("worker");
    const responseChannel = channel();
    const workerRequestId = "testID";
    runSaga(
      {},
      w.duplexResponseHandler,
      workerRequestId,
      mockWorkerChannel,
      responseChannel,
    );
    MockWorker.instance.postMessage = jest.fn();

    let randomRequestCount = Math.floor(Math.random() * 10);

    for (randomRequestCount; randomRequestCount > 0; randomRequestCount--) {
      responseChannel.put({
        test: randomRequestCount,
      });
      expect(MockWorker.instance.postMessage).toBeCalledWith({
        test: randomRequestCount,
        requestId: workerRequestId,
      });
    }

    responseChannel.put({
      finished: true,
    });

    expect(mockWorkerChannel.close).toBeCalled();
  });
});
