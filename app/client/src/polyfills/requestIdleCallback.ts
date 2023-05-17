/**
 * requestIdleCallback is not available in Safari browser.
 * If unavailable, then use a timeout to process callback on a separate thread.
 */
(window as any).requestIdleCallback =
  (window as any).requestIdleCallback ||
  function (
    cb: (arg0: { didTimeout: boolean; timeRemaining: () => number }) => void,
  ) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

(window as any).cancelIdleCallback =
  (window as any).cancelIdleCallback ||
  function (id: number) {
    clearTimeout(id);
  };

export {};
