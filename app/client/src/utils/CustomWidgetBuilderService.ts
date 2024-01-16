interface Connection {
  onMessage: (type: string, fn: (data: unknown) => void) => () => void;
  postMessage: (message: unknown) => void;
  window: Window | null;
}

const createChannel = (): Connection => {
  const builderWindow = window.open(
    `${window.location.pathname}/builder`,
    "_blank",
  );

  const onMessageMap = new Map<string, ((data: unknown) => void)[]>();

  function onMessage(type: string, fn: (data: unknown) => void) {
    let eventHandlerList = onMessageMap.get(type);

    if (eventHandlerList && eventHandlerList instanceof Array) {
      eventHandlerList.push(fn);
    } else {
      eventHandlerList = [fn];
      onMessageMap.set(type, eventHandlerList);
    }
    return () => {
      if (eventHandlerList) {
        const index = eventHandlerList.indexOf(fn);

        if (index > -1) {
          eventHandlerList.splice(index, 1);
        }
      }
    };
  }

  window?.addEventListener("message", (event) => {
    if (event.source === builderWindow) {
      const handlerList = onMessageMap.get(event.data.type);
      if (handlerList) {
        handlerList.forEach((fn) => fn(event.data));
      }
    }
  });

  const postMessage = (message: unknown) => {
    builderWindow?.postMessage(message, "*");
  };

  return {
    window: builderWindow,
    postMessage,
    onMessage,
  };
};

export default class CustomWidgetBuilderService {
  private static builderWindowConnections: Map<string, Connection> = new Map();

  static createConnection(widgetId: string) {
    const channel = createChannel();
    this.builderWindowConnections.set(widgetId, channel);
    return channel;
  }

  static isConnected(widgetId: string) {
    const connection = this.builderWindowConnections.get(widgetId);

    return connection && connection.window && !connection.window.closed;
  }

  static focus(widgetId: string) {
    if (this.isConnected(widgetId)) {
      this.builderWindowConnections.get(widgetId)?.window?.focus();
    }
  }

  static getConnection(widgetId: string) {
    if (this.isConnected(widgetId)) {
      const { onMessage, postMessage } = this.builderWindowConnections.get(
        widgetId,
      ) as Connection;

      return {
        onMessage,
        postMessage,
      };
    }
  }

  static closeConnection(widgetId: string, skipClosing?: boolean) {
    if (this.builderWindowConnections.has(widgetId)) {
      if (!skipClosing) {
        const connection = this.builderWindowConnections.get(widgetId);

        connection?.window?.close();
      }

      this.builderWindowConnections.delete(widgetId);
    }
  }

  static closeAllConnections() {
    this.builderWindowConnections.forEach((connection) => {
      connection?.window?.close();
    });

    this.builderWindowConnections.clear();
  }
}
