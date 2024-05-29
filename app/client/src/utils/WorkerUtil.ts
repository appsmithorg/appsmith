import { cancelled, delay, put, take } from "redux-saga/effects";
import type { Channel } from "redux-saga";
import { channel, buffers } from "redux-saga";
import { uniqueId } from "lodash";
import log from "loglevel";
import type { TMessage } from "./MessageUtil";
import { MessageType, sendMessage } from "./MessageUtil";
import type { OtlpSpan } from "UITelemetry/generateTraces";
import { endSpan, startRootSpan } from "UITelemetry/generateTraces";
import type { WebworkerSpanData } from "UITelemetry/generateWebWorkerTraces";
import {
  convertWebworkerSpansToRegularSpans,
  newWebWorkerSpanData,
} from "UITelemetry/generateWebWorkerTraces";

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
// TODO: Extract the worker wrapper into a library to be useful to anyone with WebWorkers + redux-saga.
// TODO: Add support for timeouts on requests and shutdown.
// TODO: Add a readiness + liveness probes.
export class GracefulWorkerService {
  // We keep track of all in-flight requests with these channels.
  private readonly _channels: Map<string, Channel<any>>;
  // The actual WebWorker
  private _Worker: Worker | undefined;

  // Channels in redux-saga are NOT like signals.
  // They operate in `pulse` mode of a signal. But `readiness` is more like a continuous signal.
  // This variable provides the equivalent of the `hold` state signal.
  // If isReady is false, wait on `this._readyChan` to get the pulse signal.
  private _isReady: boolean;
  // Channel to signal all waiters that we're ready. Always use it with `this._isReady`.
  private readonly _readyChan: Channel<any>;

  private readonly _workerClass: Worker;

  private listenerChannel: Channel<TMessage<any>>;

  constructor(workerClass: Worker) {
    this.shutdown = this.shutdown.bind(this);
    this.start = this.start.bind(this);
    this._broker = this._broker.bind(this);
    this.request = this.request.bind(this);
    this.respond = this.respond.bind(this);
    this.ping = this.ping.bind(this);

    // Do not buffer messages on this channel
    this._readyChan = channel(buffers.none());
    this._isReady = false;
    this._channels = new Map<string, Channel<any>>();
    this._workerClass = workerClass;
    this.listenerChannel = channel();
  }

  /**
   * Start a new worker and registers our broker.
   * Note: If the worker is already running, this is a no-op
   */
  *start() {
    if (this._isReady || this._Worker) return;
    this._Worker = this._workerClass;
    this._Worker.addEventListener("message", this._broker);
    // Inform all pending requests that we're good to go!
    this._isReady = true;
    yield put(this._readyChan, true);
    return this.listenerChannel;
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
    if (!this._Worker) return;
    this._Worker.removeEventListener("message", this._broker);
    this._Worker.terminate();
    this._Worker = undefined;
    this.listenerChannel.close();
  }

  /**
   * Check if the worker is ready, optionally block on it.
   */
  *ready(block = false) {
    if (this._isReady && this._Worker) return true;
    if (block) {
      yield take(this._readyChan);
      return true;
    }
    return false;
  }

  *respond(messageId = "", data = {}): any {
    if (!messageId) return;
    yield this.ready(true);
    if (!this._Worker) return;
    const messageType = MessageType.RESPONSE;

    sendMessage.call(this._Worker, {
      body: {
        data,
      },
      messageId,
      messageType,
    });
  }

  *ping(data = {}, messageId?: string): any {
    yield this.ready(true);
    if (!this._Worker) return;
    const messageType = MessageType.DEFAULT;
    sendMessage.call(this._Worker, {
      body: data,
      messageId,
      messageType,
    });
  }

  private addChildSpansToRootSpan({
    endTime,
    method,
    rootSpan,
    startTime,
    webworkerTelemetry,
    data
  }: {
    webworkerTelemetry: Record<string, WebworkerSpanData>;
    rootSpan: OtlpSpan | undefined;
    method: string;
    startTime: number;
    endTime: number;
    data: any
  }) {
    const webworkerTelemetryResponse = webworkerTelemetry as Record<
      string,
      WebworkerSpanData
    >;

    if (webworkerTelemetryResponse) {
      const { transferDataToMainThread } = webworkerTelemetryResponse;
      if (transferDataToMainThread) {
        transferDataToMainThread.endTime = Date.now();
      }
      console.log("***", "transfer time to main thread is ", transferDataToMainThread.endTime - transferDataToMainThread.startTime, method, "data is ", this.countKeyValuePairs([ { "c": 1, "d": 2, "e" : 3 } ]), this.countKeyValuePairs(data), JSON.parse(data.updates));

      const start = performance.now()
      const resp = JSON.parse(JSON.stringify(data))// structuredClone(data)
      const end = performance.now()
      console.log("***", "structured clone data with json parse is ", resp, " time taken is ", end - start)

      /// Add the completeWebworkerComputation span to the root span
      webworkerTelemetryResponse["completeWebworkerComputation"] = {
        startTime,
        endTime,
        attributes: {},
        spanName: "completeWebworkerComputation",
      };
    }
    //we are attaching the child spans to the root span over here
    rootSpan &&
      convertWebworkerSpansToRegularSpans(rootSpan, webworkerTelemetryResponse);

    //genereate separate completeWebworkerComputationRoot root span
    // this span does not contain any child spans, it just captures the webworker computation alone
    const completeWebworkerComputationRoot = startRootSpan(
      "completeWebworkerComputationRoot",
      undefined,
      startTime,
    );
    completeWebworkerComputationRoot?.setAttribute("taskType", method);
    completeWebworkerComputationRoot?.end(endTime);
  }
  /**
   * Send a request to the worker for processing.
   * If the worker isn't ready, we wait for it to become ready.
   *
   * @param method identifier for a rpc method
   * @param requestData data that we want to send over to the worker
   *
   * @returns response from the worker
   */
  *request(method: string, data = {}): any {
    yield this.ready(true);
    // Impossible case, but helps avoid `?` later in code and makes it clearer.
    if (!this._Worker) return;

    /**
     * We create a unique channel to wait for a response of this specific request.
     */
    const messageId = `${method}__${uniqueId()}`;
    const ch = channel();
    this._channels.set(messageId, ch);
    const mainThreadStartTime = Date.now();
    let timeTaken;
    const rootSpan = startRootSpan(method);

    const webworkerTelemetryData: Record<string, WebworkerSpanData> = {
      transferDataToWorkerThread: newWebWorkerSpanData(
        "transferDataToWorkerThread",
        {},
      ),
    };

    const body = {
      method,
      data,
      webworkerTelemetry: webworkerTelemetryData,
    };

    try {
      sendMessage.call(this._Worker, {
        messageType: MessageType.REQUEST,
        body: body,
        messageId,
      });

      // The `this._broker` method is listening to events and will pass response to us over this channel.
      // console.log("***", "waiting for response in request method")
      const response = yield take(ch);
      // console.log("***", "got response in request method", messageId)
      const { data, endTime, startTime } = response;
      const { webworkerTelemetry } = data;
      this.addChildSpansToRootSpan({
        webworkerTelemetry,
        rootSpan,
        method,
        startTime,
        endTime,
        data
      });

      timeTaken = endTime - startTime;
      return data;
    } finally {
      // Log perf of main thread and worker
      const mainThreadEndTime = Date.now();
      const timeTakenOnMainThread = mainThreadEndTime - mainThreadStartTime;
      if (yield cancelled()) {
        rootSpan?.setAttribute("cancelled", true);
        log.debug(`Main ${method} cancelled in ${timeTakenOnMainThread}ms`);
      } else {
        log.debug(`Main ${method} took ${timeTakenOnMainThread}ms`);
      }

      if (timeTaken) {
        const transferTime = timeTakenOnMainThread - timeTaken;
        log.debug(` Worker ${method} took ${timeTaken}ms`);
        log.debug(` Transfer ${method} took ${transferTime}ms`);
      }
      endSpan(rootSpan);
      // Cleanup
      ch.close();
      this._channels.delete(messageId);
    }
  }

  countKeyValuePairs(obj : any) {
    let count = 0;

    // Iterate over each key in the object
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            // If the value is an array, count its length and recursively count key-value pairs for each element
            if (Array.isArray(obj[key])) {
                count += obj[key].length;
                obj[key].forEach((element : any) => {
                    if (typeof element === 'object' && element !== null) {
                        count += this.countKeyValuePairs(element);
                    } else {
                        count++;
                    }
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                // If the value is another object, recursively count its key-value pairs
                count += this.countKeyValuePairs(obj[key]);
            } else {
                // If the value is neither an object nor an array, increment the count
                count++;
            }
        }
    }

    return count;
}

  private _broker(event: MessageEvent<TMessage<any>>) {
    // console.log("***", "broker received event", event, event.data.messageId, event.data.messageType)

    if (!event || !event.data) return;
    const { body, messageType } = event.data;
    if (messageType === MessageType.RESPONSE) {
      const { messageId } = event.data;
      if (!messageId) return;
      const ch = this._channels.get(messageId);
      if (ch) {
        if (body.data.webworkerTelemetry) {
          console.log("***", "\n\nbroker putting data in channel", messageId, "time taken is ", Date.now() - body.data.webworkerTelemetry.transferDataToMainThread.startTime)
          // console.log("***", "broker putting data in channel", messageId, "time taken is ", body.data.webworkerTelemetry)
        }
        
        ch.put(body);
        
        this._channels.delete(messageId);
      }
    } else {
      this.listenerChannel.put(event.data);
    }
  }
}
