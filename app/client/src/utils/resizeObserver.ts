// A utility that returns a single instance of ResizeObserver to be used across the application.
// This is to avoid creating multiple instances of ResizeObserver which can cause performance issues.

let instance: unknown = null;

type ResizeObserCallback = (
  entry: ResizeObserverEntry,
  observer: ResizeObserver,
) => void;

class SingletonResizeObserver {
  private callbacksMap = new Map<Element, ResizeObserCallback[]>();

  constructor() {
    if (instance) {
      throw new Error("SingletonResizeObserver is a singleton class");
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;
  }

  private resizeObserver = new ResizeObserver((entries, observer) => {
    entries.forEach((entry) => {
      const callbacks = this.callbacksMap.get(entry.target) ?? [];
      callbacks.forEach((callback) => callback(entry, observer));
    });
  });

  /**
   *
   * @param target The element to observe
   * @param callback The callback to be called when the element is resized
   */
  observe(target: Element, callback: ResizeObserCallback) {
    this.resizeObserver.observe(target);
    const callbacks = this.callbacksMap.get(target) ?? [];
    callbacks.push(callback);
    this.callbacksMap.set(target, [callback]);
  }

  /**
   *
   * @param target The element to unobserve
   * @param callback The callback to be removed
   */
  unobserve(target: Element, callback: ResizeObserCallback) {
    const callbacks = this.callbacksMap.get(target) ?? [];
    const index = callbacks.indexOf(callback);
    if (index >= 0) {
      callbacks.splice(index, 1);
    }
    if (callbacks.length === 0) {
      this.resizeObserver.unobserve(target);
    }
  }
}

const resizeObserver = new SingletonResizeObserver();

export default resizeObserver;
