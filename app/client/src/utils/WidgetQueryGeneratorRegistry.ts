import { error } from "loglevel";

export default class WidgetQueryGeneratorRegistry {
  private static queryGeneratorMap = new Map();

  static register(pluginId: string, queryGenerator: any) {
    if (this.queryGeneratorMap.get(pluginId)) {
      error("Overwriting an query generator", pluginId);

      return;
    }

    this.queryGeneratorMap.set(pluginId, queryGenerator);
  }

  static clear() {
    WidgetQueryGeneratorRegistry.queryGeneratorMap = new Map();
  }

  static get(pluginId: string) {
    const adaptor = this.queryGeneratorMap.get(pluginId);

    if (!adaptor) {
      error("No query generator present", pluginId);
      return;
    }

    return adaptor;
  }
}
