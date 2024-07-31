import type { CallbackHandlerEventType } from "./CallbackHandlerEventType";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackHandlerBaseEvents = Record<CallbackHandlerEventType, any[]>;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallbackHandlersCallback = (...args: any) => void;

abstract class BaseCallbackHandler {
  private readonly events = new Map<
    keyof CallbackHandlerBaseEvents,
    CallbackHandlersCallback[]
  >();

  /**
   *Add an event listener
   *@ param type listening type
   *@ param callback processing callback
   * @returns {@code this}
   */
  add(
    type: CallbackHandlerEventType,
    callback: (
      ...args: CallbackHandlerBaseEvents[CallbackHandlerEventType]
    ) => void,
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
    callback: (
      ...args: CallbackHandlerBaseEvents[CallbackHandlerEventType]
    ) => void,
  ) {
    const callbacks = this.events.get(type) || [];
    this.events.set(
      type,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  emit(
    type: CallbackHandlerEventType,
    ...args: CallbackHandlerBaseEvents[CallbackHandlerEventType]
  ) {
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

export default BaseCallbackHandler;
