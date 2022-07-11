/*

This file polyfills the following: https://github.com/whatwg/dom/issues/911
Once all targeted browsers support this DOM feature, this polyfill can be deleted.

This allows users to pass an AbortSignal to a call to addEventListener as part of the
AddEventListenerOptions object. When the signal is aborted, the event listener is
removed.

*/

let signalSupported = false;
// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
try {
  const options = Object.create(
    {},
    {
      signal: {
        get() {
          signalSupported = true;
        },
      },
    },
  );
  window.addEventListener("test", noop, options);
  window.removeEventListener("test", noop, options);
} catch (e) {
  /* */
}
function featureSupported(): boolean {
  return signalSupported;
}

function monkeyPatch() {
  if (typeof window === "undefined") {
    return;
  }

  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(
    name,
    originalCallback,
    optionsOrCapture,
  ) {
    if (
      typeof optionsOrCapture === "object" &&
      "signal" in optionsOrCapture &&
      optionsOrCapture.signal instanceof AbortSignal
    ) {
      originalAddEventListener.call(optionsOrCapture.signal, "abort", () => {
        this.removeEventListener(name, originalCallback, optionsOrCapture);
      });
    }
    return originalAddEventListener.call(
      this,
      name,
      originalCallback,
      optionsOrCapture,
    );
  };
}

export function polyfill(): void {
  if (!featureSupported()) {
    monkeyPatch();
    signalSupported = true;
  }
}

declare global {
  interface AddEventListenerOptions {
    signal?: AbortSignal;
  }
}
