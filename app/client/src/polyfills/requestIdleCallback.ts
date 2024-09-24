/**
 * requestIdleCallback is not available in Safari browser.
 * If unavailable, then use a timeout to process callback on a separate thread.
 */
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).requestIdleCallback =
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).cancelIdleCallback =
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).cancelIdleCallback ||
  function (id: number) {
    clearTimeout(id);
  };

export {};
