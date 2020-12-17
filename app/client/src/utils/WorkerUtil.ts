import { all, put, take, takeEvery } from "redux-saga/effects";
import {
  eventChannel,
  EventChannel,
  channel,
  Channel,
  END,
  buffers,
} from "redux-saga";
import _ from "lodash";

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
 * Worker is expected to respond with an object with exactly the `requestId` and `responseData` keys:
 * {
 *   requestId: "<the id it received>",
 *   responseData: 42
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
// TODO: Add telemetry.
export class GracefulWorkerService {
  // We keep track of all in-flight requests with these channels.
  private _channels: {
    [requestId: string]: Channel<any>;
  };
  // Redux-saga's channel subscriber for our worker.
  private _workerChannel: EventChannel<any> | undefined;
  // The actual WebWorker
  private _evaluationWorker: Worker | undefined;

  // Channels in redux-saga are NOT like signals.
  // They operate in `pulse` mode of a signal. But `readiness` is more like a continuous signal.
  // This variable provides the equivalent of the `hold` state signal.
  // If isReady is false, wait on `this._readyChan` to get the pulse signal.
  private _isReady: boolean;
  // Channel to signal all waiters that we're ready. Always use it with `this._isReady`.
  private _readyChan: Channel<any>;

  private _workerClass: any;

  constructor(workerClass: any) {
    this.shutdown = this.shutdown.bind(this);
    this.start = this.start.bind(this);
    this.request = this.request.bind(this);
    this._broker = this._broker.bind(this);

    // Do not buffer messages on this channel
    this._readyChan = channel(buffers.none());
    this._isReady = false;
    this._channels = {};
    this._workerClass = workerClass;
  }

  /**
   * Start a new worker and registers our broker.
   * Note: Shuts down the old worker, if one exists.
   */
  *start() {
    //TODO: call this on editor unmount as part of a separate PR
    yield this.shutdown();
    this._evaluationWorker = new this._workerClass();
    this._workerChannel = eventChannel(emitter => {
      if (!this._evaluationWorker) {
        // Impossible case unless something really went wrong
        // END the channel in that case
        emitter(END);
        return _.noop;
      }

      this._evaluationWorker.addEventListener("message", emitter);
      // The subscriber must return an unsubscribe function
      return () => {
        if (!this._evaluationWorker) return;
        this._evaluationWorker.removeEventListener("message", emitter);
        this._evaluationWorker.terminate();
        this._evaluationWorker = undefined;
      };
    });

    // Listen to all messages from the channel and send it to our broker
    yield takeEvery(this._workerChannel, this._broker);

    // Inform all pending requests that we're good to go!
    this._isReady = true;
    yield put(this._readyChan, true);
  }

  /**
   * Gracefully shutdown the worker.
   */
  *shutdown() {
    // Ignore if already shutdown/shutting down
    if (!this._isReady) return;
    // stop accepting new requests
    this._isReady = false;
    // wait for current responses to drain
    yield all(Object.values(this._channels).map(c => take(c)));
    // close the worker
    yield this._workerChannel?.close();
  }

  /**
   * Send a request to the worker for processing.
   * If the worker has not started yet, we wait for it to become ready.
   *
   * @param method identifier for a rpc method
   * @param requestData data that we want to send over to the worker
   *
   * @returns response from the worker
   */
  *request(method: string, requestData = {}): any {
    if (!this._evaluationWorker || !this._isReady) {
      // Block requests till the worker is ready.
      yield take(this._readyChan);
      // Impossible case, but helps avoid `?` later in code and makes it clearer.
      if (!this._evaluationWorker) return;
    }
    /**
     * We create a unique channel to wait for a response of this specific request.
     */
    const requestId = `${method}__${_.uniqueId()}`;
    this._channels[requestId] = channel();
    this._evaluationWorker.postMessage({
      method,
      requestData,
      requestId,
    });
    // The `this._broker` method is listening to events and will pass response to us over this channel.
    const response = yield take(this._channels[requestId]);
    yield this._channels[requestId].close(); // cleanup
    delete this._channels[requestId];
    return response;
  }

  private *_broker(event: MessageEvent) {
    if (!event || !event.data) {
      return;
    }
    const { requestId, responseData } = event.data;
    yield put(this._channels[requestId], responseData);
  }
}
