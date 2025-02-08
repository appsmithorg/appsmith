export class Builder {
  builderWindow: Window | null;

  onMessageMap: Map<string, ((data: unknown) => void)[]> = new Map();

  handleMessageBound = this.handleMessage.bind(this);

  constructor() {
    // when we add new widget, we add a /add to the url , so before opening the builder, we need to remove it
    const path = window.location.pathname.replace(/\/add$/, "");

    this.builderWindow = window.open(`${path}/builder`, "_blank");

    window?.addEventListener("message", this.handleMessageBound);
  }

  handleMessage(event: MessageEvent) {
    if (event.source === this.builderWindow) {
      const handlerList = this.onMessageMap.get(event.data.type);

      if (handlerList) {
        handlerList.forEach((fn) => fn?.(event.data));
      }
    }
  }

  onMessage(type: string, fn: (data: unknown) => void) {
    let eventHandlerList = this.onMessageMap.get(type);

    if (eventHandlerList && eventHandlerList instanceof Array) {
      eventHandlerList.push(fn);
    } else {
      eventHandlerList = [fn];
      this.onMessageMap.set(type, eventHandlerList);
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

  postMessage(message: unknown) {
    this.builderWindow?.postMessage(message, "*");
  }

  isConnected() {
    return !this.builderWindow?.closed;
  }

  focus() {
    this.builderWindow?.focus();
  }

  close(closeWindow: boolean) {
    if (closeWindow) {
      this.builderWindow?.close();
    }

    window?.removeEventListener("message", this.handleMessageBound);
  }
}

export default class CustomWidgetBuilderService {
  private static builderWindowConnections: Map<string, Builder> = new Map();

  // For unit testing purposes
  private static builderFactory = Builder;

  // For unit testing purposes
  static setBuilderFactory(builder: typeof Builder) {
    this.builderFactory = builder;
  }

  static createBuilder(widgetId: string) {
    const builder = new this.builderFactory();

    this.builderWindowConnections.set(widgetId, builder);

    return builder;
  }

  static isConnected(widgetId: string) {
    const builder = this.builderWindowConnections.get(widgetId);

    return builder?.isConnected();
  }

  static focus(widgetId: string) {
    if (this.isConnected(widgetId)) {
      this.builderWindowConnections.get(widgetId)?.focus();
    }
  }

  static getBuilder(widgetId: string) {
    if (this.isConnected(widgetId)) {
      const builder = this.builderWindowConnections.get(widgetId) as Builder;

      return builder;
    }
  }

  static closeBuilder(widgetId: string, closeWindow: boolean) {
    if (this.builderWindowConnections.has(widgetId)) {
      const builder = this.builderWindowConnections.get(widgetId);

      builder?.close(closeWindow);

      this.builderWindowConnections.delete(widgetId);
    }
  }
}
