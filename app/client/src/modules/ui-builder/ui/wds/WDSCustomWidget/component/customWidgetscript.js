// Custom widget events definition
export const EVENTS = {
  CUSTOM_WIDGET_READY: "CUSTOM_WIDGET_READY",
  CUSTOM_WIDGET_READY_ACK: "CUSTOM_WIDGET_READY_ACK",
  CUSTOM_WIDGET_UPDATE_MODEL: "CUSTOM_WIDGET_UPDATE_MODEL",
  CUSTOM_WIDGET_TRIGGER_EVENT: "CUSTOM_WIDGET_TRIGGER_EVENT",
  CUSTOM_WIDGET_MODEL_CHANGE: "CUSTOM_WIDGET_MODEL_CHANGE",
  CUSTOM_WIDGET_UI_CHANGE: "CUSTOM_WIDGET_UI_CHANGE",
  CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK: "CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK",
  CUSTOM_WIDGET_CONSOLE_EVENT: "CUSTOM_WIDGET_CONSOLE_EVENT",
  CUSTOM_WIDGET_THEME_UPDATE: "CUSTOM_WIDGET_THEME_UPDATE",
  CUSTOM_WIDGET_UPDATE_HEIGHT: "CUSTOM_WIDGET_UPDATE_HEIGHT",
};

// Function to create a communication channel to the parent
export const createChannelToParent = () => {
  const onMessageMap = new Map();

  // Function to register an event handler for a message type
  function onMessage(type, fn) {
    let eventHandlerList = onMessageMap.get(type);

    if (eventHandlerList && eventHandlerList instanceof Array) {
      eventHandlerList.push(fn);
    } else {
      eventHandlerList = [fn];
      onMessageMap.set(type, eventHandlerList);
    }

    return () => {
      // Function to unsubscribe an event handler
      const index = eventHandlerList.indexOf(fn);

      eventHandlerList.splice(index, 1);
    };
  }

  // Listen for 'message' events and dispatch to registered event handlers
  window.addEventListener("message", (event) => {
    if (event.source === window.parent) {
      const handlerList = onMessageMap.get(event.data.type);

      if (handlerList) {
        handlerList.forEach((fn) => fn(event.data));
      }
    }
  });
  // Queue to hold postMessage requests
  const postMessageQueue = [];
  // Flag to indicate if the flush is scheduled
  let isFlushScheduled = false;

  /*
   * Function to schedule microtask to flush postMessageQueue
   * to ensure the order of message processed on the parent
   */
  const scheduleMicrotaskToflushPostMessageQueue = () => {
    if (!isFlushScheduled) {
      isFlushScheduled = true;
      queueMicrotask(() => {
        (async () => {
          while (postMessageQueue.length > 0) {
            const message = postMessageQueue.shift();

            await new Promise((resolve) => {
              const key = Math.random();
              const unlisten = onMessage(
                EVENTS.CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK,
                (data) => {
                  if (data.key === key && data.success) {
                    unlisten();
                    resolve();
                  }
                },
              );

              // Send the message to the parent
              window.parent.postMessage(
                Object.assign(Object.assign({}, message), { key }),
                "*",
              );
            });
          }

          isFlushScheduled = false;
        })();
      });
    }
  };

  return {
    onMessageMap,
    postMessage: (type, data) => {
      try {
        // Try block to catch non clonealbe data error while postmessaging
        // throw error if the data is not cloneable
        postMessageQueue.push({
          type,
          data,
        });

        scheduleMicrotaskToflushPostMessageQueue();
      } catch (e) {
        throw e;
      }
    },
    onMessage,
  };
};

/*
 * Function to initialize the script
 * wrapping this inside a function to make it testable
 */
export function main() {
  // Create a communication channel to the parent
  const channel = createChannelToParent();
  /*
   * Variables to hold the subscriber functions
   */
  const modelSubscribers = [];
  const uiSubscribers = [];
  const themeSubscribers = [];
  /*
   * Variables to hold ready function and state
   */
  let onReady;
  let isReady = false;
  let isReadyCalled = false;

  const heightObserver = new ResizeObserver(() => {
    const height = document.body.clientHeight;

    channel.postMessage(EVENTS.CUSTOM_WIDGET_UPDATE_HEIGHT, {
      height,
    });
  });

  // Callback for when the READY_ACK message is received
  channel.onMessage(EVENTS.CUSTOM_WIDGET_READY_ACK, (event) => {
    window.appsmith.model = event.model;
    window.appsmith.ui = event.ui;
    window.appsmith.theme = event.theme;
    window.appsmith.mode = event.mode;
    heightObserver.observe(window.document.body);

    // Subscribe to model and UI changes
    window.appsmith.onModelChange(generateAppsmithCssVariables("model"));
    window.appsmith.onUiChange(generateAppsmithCssVariables("ui"));
    window.appsmith.onThemeChange(generateAppsmithCssVariables("theme"));

    // Set the widget as ready
    isReady = true;

    if (!isReadyCalled && onReady) {
      onReady();
      isReadyCalled = true;
    }
  });
  // Callback for when MODEL_CHANGE message is received
  channel.onMessage(EVENTS.CUSTOM_WIDGET_MODEL_CHANGE, (event) => {
    if (event.model) {
      const prevModel = window.appsmith.model;

      window.appsmith.model = event.model;

      // Notify model subscribers
      modelSubscribers.forEach((fn) => {
        fn(event.model, prevModel);
      });
    }
  });
  // Callback for when UI_CHANGE message is received
  channel.onMessage(EVENTS.CUSTOM_WIDGET_UI_CHANGE, (event) => {
    if (event.ui) {
      const prevUi = window.appsmith.ui;

      window.appsmith.ui = event.ui;
      // Notify UI subscribers
      uiSubscribers.forEach((fn) => {
        fn(event.ui, prevUi);
      });
    }
  });

  channel.onMessage(EVENTS.CUSTOM_WIDGET_THEME_UPDATE, (event) => {
    if (event.theme) {
      const prevTheme = window.appsmith.theme;

      window.appsmith.theme = event.theme;
      // Notify theme subscribers
      themeSubscribers.forEach((fn) => {
        fn(event.theme, prevTheme);
      });
    }

    if (event.cssTokens) {
      const el = document.querySelector("[data-appsmith-theme]");

      if (el) {
        el.innerHTML = event.cssTokens;
      } else {
        // Use appendChild instead of innerHTML to add the style element
        const styleElement = document.createElement("style");

        styleElement.setAttribute("data-appsmith-theme", "");
        styleElement.innerHTML = event.cssTokens;
        document.head.appendChild(styleElement);
      }
    }
  });

  if (!window.appsmith) {
    // Define appsmith global object
    Object.defineProperty(window, "appsmith", {
      configurable: false,
      writable: false,
      value: {
        mode: "",
        theme: {},
        onThemeChange: (fn) => {
          if (typeof fn !== "function") {
            throw new Error("onThemeChange expects a function as parameter");
          }

          themeSubscribers.push(fn);
          fn(window.appsmith.theme);

          return () => {
            // Unsubscribe from theme changes
            const index = themeSubscribers.indexOf(fn);

            if (index > -1) {
              themeSubscribers.splice(index, 1);
            }
          };
        },
        onUiChange: (fn) => {
          if (typeof fn !== "function") {
            throw new Error("onUiChange expects a function as parameter");
          }

          uiSubscribers.push(fn);
          fn(window.appsmith.ui);

          return () => {
            // Unsubscribe from UI changes
            const index = uiSubscribers.indexOf(fn);

            if (index > -1) {
              uiSubscribers.splice(index, 1);
            }
          };
        },
        onModelChange: (fn) => {
          if (typeof fn !== "function") {
            throw new Error("onModelChange expects a function as parameter");
          }

          modelSubscribers.push(fn);
          fn(window.appsmith.model);

          return () => {
            // Unsubscribe from model changes
            const index = modelSubscribers.indexOf(fn);

            if (index > -1) {
              modelSubscribers.splice(index, 1);
            }
          };
        },
        updateModel: (obj) => {
          if (!obj || typeof obj !== "object") {
            throw new Error("updateModel expects an object as parameter");
          }

          appsmith.model = Object.assign(
            Object.assign({}, appsmith.model),
            obj,
          );

          // Send an update model message to the parent
          channel.postMessage(EVENTS.CUSTOM_WIDGET_UPDATE_MODEL, obj);
        },
        triggerEvent: (eventName, contextObj) => {
          if (typeof eventName !== "string") {
            throw new Error("eventName should be a string");
          } else if (contextObj && typeof contextObj !== "object") {
            throw new Error("contextObj should be an object");
          }

          // Send a trigger event message to the parent
          channel.postMessage(EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT, {
            eventName,
            contextObj,
          });
        },
        model: {},
        ui: {},
        onReady: (fn) => {
          if (typeof fn !== "function") {
            throw new Error("onReady expects a function as parameter");
          }

          onReady = fn;

          if (isReady && !isReadyCalled && onReady) {
            onReady();
            isReadyCalled = true;
          }
        },
      },
    });
  }

  // Listen for the 'load' event and send READY message to the parent
  window.addEventListener("load", () => {
    channel.postMessage(EVENTS.CUSTOM_WIDGET_READY);
  });
}

/*
 * Function to create appsmith css variables for model and ui primitive values
 * variables get regenerated every time the model or ui changes.
 */
export const generateAppsmithCssVariables = (provider) => (source) => {
  let cssTokens = document.getElementById(`appsmith-${provider}-css-tokens`);

  if (!cssTokens) {
    cssTokens = document.createElement("style");
    cssTokens.id = `appsmith-${provider}-css-tokens`;
    window.document.head.appendChild(cssTokens);
  }

  const cssTokensContent = Object.keys(source).reduce((acc, key) => {
    if (typeof source[key] === "string" || typeof source[key] === "number") {
      return `
    ${acc}
    --appsmith-${provider}-${key}: ${source[key]};
    `;
    } else {
      return acc;
    }
  }, "");

  cssTokens.innerHTML = `:root {${cssTokensContent}}`;
};
