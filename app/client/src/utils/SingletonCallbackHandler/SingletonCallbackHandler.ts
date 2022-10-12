import { CallbackHandlerEventType } from "./CallbackHandlerEventType";

type CallbackHandlerBaseEvents = Record<CallbackHandlerEventType, any[]>;

type CallbackHandlersCallback = (...args: any) => void;

class SingletonCallbackHandler<T extends CallbackHandlerBaseEvents> {
  private static instance: SingletonCallbackHandler<CallbackHandlerBaseEvents>;
  private readonly events = new Map<keyof T, CallbackHandlersCallback[]>();

  /**
   * The SingletonCallbackHandler's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  /* eslint-disable @typescript-eslint/no-empty-function */
  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): SingletonCallbackHandler<
    CallbackHandlerBaseEvents
  > {
    if (!SingletonCallbackHandler.instance) {
      SingletonCallbackHandler.instance = new SingletonCallbackHandler();
    }

    return SingletonCallbackHandler.instance;
  }

  /**
   *Add an event listener
   *@ param type listening type
   *@ param callback processing callback
   * @returns {@code this}
   */
  add(
    type: CallbackHandlerEventType,
    callback: (...args: T[CallbackHandlerEventType]) => void,
  ) {
    const callbacks = this.events.get(type) || [];
    callbacks.push(callback);
    this.events.set(type, callbacks);
    return this;
  }
  /**
   *Remove an event listener
   *@ param type listening type
   *@ param callback processing callback
   * @returns {@code this}
   */
  remove(
    type: CallbackHandlerEventType,
    callback: (...args: T[CallbackHandlerEventType]) => void,
  ) {
    const callbacks = this.events.get(type) || [];
    this.events.set(
      type,
      callbacks.filter((fn: any) => fn !== callback),
    );
    return this;
  }
  /**
   *Remove a class of event listeners
   *@ param type listening type
   * @returns {@code this}
   */
  removeByType(type: CallbackHandlerEventType) {
    this.events.delete(type);
    return this;
  }
  /**
   *Trigger a kind of event listener
   *@ param type listening type
   *@ param args the parameters needed to process the callback
   * @returns {@code this}
   */
  emit(type: CallbackHandlerEventType, ...args: T[CallbackHandlerEventType]) {
    const callbacks = this.events.get(type) || [];
    callbacks.forEach((fn) => {
      fn(...args);
    });
    return this;
  }

  /**
   *Get a kind of event listener
   *@ param type listening type
   *@ returns is a read-only array. If it cannot be found, it will return an empty array {@ code []}
   */
  listeners(type: CallbackHandlerEventType) {
    return Object.freeze(this.events.get(type) || []);
  }
}

export default SingletonCallbackHandler.getInstance();
