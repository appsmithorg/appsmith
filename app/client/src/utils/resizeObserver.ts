// A utility that returns a single instance of ResizeObserver to be used across the application.
// This is to avoid creating multiple instances of ResizeObserver which can cause performance issues.

import ResizeObserver from "resize-observer-polyfill";

type ResizeObserCallback = (
  entry: ResizeObserverEntry,
  observer: ResizeObserver,
) => void;

class SingletonResizeObserver {
  private callbacksMap = new Map<Element, ResizeObserCallback[]>();
  private static instance: SingletonResizeObserver;

  constructor() {
    if (SingletonResizeObserver.instance) {
      throw new Error("SingletonResizeObserver is a singleton class");
    }

    SingletonResizeObserver.instance = this;
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
   * @param callbacks The array of callbacks to be called when the element resizes
   */
  observe(target: Element, callbacks: ResizeObserCallback[]) {
    this.resizeObserver.observe(target);
    const _callbacks = this.callbacksMap.get(target) ?? [];

    _callbacks.push(...callbacks);
    this.callbacksMap.set(target, _callbacks);
  }

  /**
   *
   * @param target The element to unobserve
   * @param callbacks The array of callbacks to be removed
   */
  unobserve(target: Element, callbacks: ResizeObserCallback[]) {
    const _callbacks = this.callbacksMap.get(target) ?? [];

    for (const item of callbacks) {
      const index = _callbacks.indexOf(item);

      if (index >= 0) {
        _callbacks.splice(index, 1);
      }
    }

    if (_callbacks.length === 0) {
      this.resizeObserver.unobserve(target);
      this.callbacksMap.delete(target);
    }
  }
}

const resizeObserver = new SingletonResizeObserver();

export default resizeObserver;
