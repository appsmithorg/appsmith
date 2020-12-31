import { cancelled, delay, put, take } from "redux-saga/effects";
import { channel, Channel, buffers } from "redux-saga";
import _ from "lodash";
import log from "loglevel";
import WebpackWorker from "worker-loader!";
/**
 * Wrap a webworker to provide a synchronous request-response semantic.
 *
 * Usage on main thread:
 * w = GracefulWorkerService(Worker);
 * yield w.start(); // Start the worker
 * const workerResponse = yield w.request("my_action", { hello: "world" }); // Send a request, wait for response
 *
 * Worker will receive:
 * {
 *   method: "my_action",
 *   requestId: "<unique request id>",
 *   requestData: { hello: "world" },
 * }
 *
 * Worker is expected to respond with an object with exactly the `requestId`, `timeTaken` and `responseData` keys:
 * {
 *   requestId: "<the id it received>",
 *   responseData: 42,
 *   timeTaken: 23.33,
 * }
 * All other keys will be ignored.
 * We make no assumptions about data type of `requestData` or `responseData`.
 *
 * Note: The worker will hold ALL requests, even in case of restarts.
 * If we do not want that behaviour, we should create a new GracefulWorkerService.
 */
// TODO: Add a compatible listener layer on the worker to complete the framework.
// TODO: Extract the worker wrapper into a library to be useful to anyone with WebWorkers + redux-saga.
// TODO: Add support for timeouts on requests and shutdown.
// TODO: Add a readiness + liveness probes.
export class GracefulWorkerService {
  // We keep track of all in-flight requests with these channels.
  private readonly _channels: Map<string, Channel<any>>;
  // The actual WebWorker
  private _evaluationWorker: WebpackWorker | undefined;

  // Channels in redux-saga are NOT like signals.
  // They operate in `pulse` mode of a signal. But `readiness` is more like a continuous signal.
  // This variable provides the equivalent of the `hold` state signal.
  // If isReady is false, wait on `this._readyChan` to get the pulse signal.
  private _isReady: boolean;
  // Channel to signal all waiters that we're ready. Always use it with `this._isReady`.
  private readonly _readyChan: Channel<any>;

  private readonly _workerClass: typeof WebpackWorker;

  constructor(workerClass: typeof WebpackWorker) {
    this.shutdown = this.shutdown.bind(this);
    this.start = this.start.bind(this);
    this.request = this.request.bind(this);
    this._broker = this._broker.bind(this);

    // Do not buffer messages on this channel
    this._readyChan = channel(buffers.none());
    this._isReady = false;
    this._channels = new Map<string, Channel<any>>();
    this._workerClass = workerClass;
  }

  /**
   * Start a new worker and registers our broker.
   * Note: If the worker is already running, this is a no-op
   */
  *start() {
    if (this._isReady || this._evaluationWorker) return;
    this._evaluationWorker = new this._workerClass();
    this._evaluationWorker.addEventListener("message", this._broker);
    // Inform all pending requests that we're good to go!
    this._isReady = true;
    yield put(this._readyChan, true);
  }

  /**
   * Gracefully shutdown the worker.
   * Note: If the worker is already stopped / shutting down, this is a no-op
   */
  *shutdown() {
    if (!this._isReady) return;
    // stop accepting new requests
    this._isReady = false;
    // wait for current responses to drain, check every 10 milliseconds
    while (this._channels.size > 0) {
      yield delay(10);
    }
    // close the worker
    if (!this._evaluationWorker) return;
    this._evaluationWorker.removeEventListener("message", this._broker);
    this._evaluationWorker.terminate();
    this._evaluationWorker = undefined;
  }

  /**
   * Check if the worker is ready, optionally block on it.
   */
  *ready(block = false) {
    if (this._isReady && this._evaluationWorker) return true;
    if (block) {
      yield take(this._readyChan);
      return true;
    }
    return false;
  }

  /**
   * Send a request to the worker for processing.
   * If the worker isn't ready, we wait for it to become ready.
   *
   * @param method identifier for a rpc method
   * @param requestData data that we want to send over to the worker
   *
   * @param traceId
   * @returns response from the worker
   */
  *request(method: string, requestData = {}, traceId = ""): any {
    yield this.ready(true);
    // Impossible case, but helps avoid `?` later in code and makes it clearer.
    if (!this._evaluationWorker) return;

    /**
     * We create a unique channel to wait for a response of this specific request.
     */
    const requestId = `${method}__${_.uniqueId()}`;
    const ch = channel();
    this._channels.set(requestId, ch);
    const mainThreadStartTime = performance.now();
    let timeTaken;

    try {
      this._evaluationWorker.postMessage({
        method,
        requestData,
        requestId,
      });
      // The `this._broker` method is listening to events and will pass response to us over this channel.
      const response = yield take(ch);
      timeTaken = response.timeTaken;
      const { responseData } = response;
      return responseData;
    } finally {
      // Log perf of main thread and worker
      const mainThreadEndTime = performance.now();
      const timeTakenOnMainThread = mainThreadEndTime - mainThreadStartTime;
      if (yield cancelled()) {
        // log.debug(
        //   `Main ${method} cancelled in ${timeTakenOnMainThread.toFixed(2)}ms`,
        // );
      } else {
        // log.debug(`Main ${method} took ${timeTakenOnMainThread.toFixed(2)}ms`);
      }

      if (timeTaken) {
        const transferTime = timeTakenOnMainThread - timeTaken;
        // log.debug(`Worker ${method} took ${timeTaken}ms`);
        // log.debug(`Transfer ${method} took ${transferTime.toFixed(2)}ms`);
        if (method === "EVAL_TREE") {
          console.log({
            traceId: traceId,
            transferTime: transferTime.toFixed(2),
            evalTime: timeTaken,
            total: timeTakenOnMainThread.toFixed(2),
          });
        }
      }
      // Cleanup
      yield ch.close();
      this._channels.delete(requestId);
    }
  }

  private _broker(event: MessageEvent) {
    if (!event || !event.data) {
      return;
    }
    const { requestId, responseData, timeTaken } = event.data;
    const ch = this._channels.get(requestId);
    // Channel could have been deleted if the request gets cancelled before the WebWorker can respond.
    // In that case, we want to drop the request.
    if (ch) {
      ch.put({ responseData, timeTaken });
    }
  }
}
