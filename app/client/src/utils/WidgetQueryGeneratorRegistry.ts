import { error } from "loglevel";

export default class WidgetQueryGeneratorRegistry {
  private static queryGeneratorMap = new Map();

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static register(id: string, queryGenerator: any) {
    if (WidgetQueryGeneratorRegistry.queryGeneratorMap.has(id)) {
      error("There is already a widget query generator with the given id:", id);

      return;
    }

    WidgetQueryGeneratorRegistry.queryGeneratorMap.set(id, queryGenerator);
  }

  static clear() {
    WidgetQueryGeneratorRegistry.queryGeneratorMap.clear();
  }

  static get(id: string) {
    const queryAdaptor = WidgetQueryGeneratorRegistry.queryGeneratorMap.get(id);

    if (!queryAdaptor) {
      error("Couldn't find the query generator with the given id:", id);
      return;
    }

    return queryAdaptor;
  }

  static has(id: string) {
    return WidgetQueryGeneratorRegistry.queryGeneratorMap.has(id);
  }
}
