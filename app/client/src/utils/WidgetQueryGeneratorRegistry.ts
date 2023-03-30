import { error } from "loglevel";

export default class WidgetQueryGeneratorRegistry {
  private static queryGeneratorMap = new Map();

  static register(pluginId: string, queryGenerator: any) {
    if (this.queryGeneratorMap.has(pluginId)) {
      error(
        "There is already a widget query generator with the given pluginID:",
        pluginId,
      );

      return;
    }

    this.queryGeneratorMap.set(pluginId, queryGenerator);
  }

  static clear() {
    WidgetQueryGeneratorRegistry.queryGeneratorMap.clear();
  }

  static get(pluginId: string) {
    const queryAdaptor = this.queryGeneratorMap.get(pluginId);

    if (!queryAdaptor) {
      error(
        "Couldn't find the query generator with the given pluginId:",
        pluginId,
      );
      return;
    }

    return queryAdaptor;
  }
}
