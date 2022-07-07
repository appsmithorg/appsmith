type EventType = string | number;

type BaseEvents = Record<EventType, any[]>;

type EventEmitterCallback = (...args: any) => void;

class EventEmitter<Events extends BaseEvents> {
  private readonly events = new Map<keyof Events, EventEmitterCallback[]>();

  /**
   *Add an event listener
   *@ param type listening type
   *@ param callback processing callback
   * @returns {@code this}
   */
  add<E extends keyof Events>(type: E, callback: (...args: Events[E]) => void) {
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
  remove<E extends keyof Events>(
    type: E,
    callback: (...args: Events[E]) => void,
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
  removeByType<E extends keyof Events>(type: E) {
    this.events.delete(type);
    return this;
  }
  /**
   *Trigger a kind of event listener
   *@ param type listening type
   *@ param args the parameters needed to process the callback
   * @returns {@code this}
   */
  emit<E extends keyof Events>(type: E, ...args: Events[E]) {
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
  listeners<E extends keyof Events>(type: E) {
    return Object.freeze(this.events.get(type) || []);
  }
}

export default new EventEmitter();
