import { error } from "loglevel";

export default class WidgetQueryGeneratorRegistry {
  private static queryGeneratorMap = new Map();

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

//testing coder
WidgetQueryGeneratorRegistry.register("5e687c18fb01e64e6a3f873f", {});
WidgetQueryGeneratorRegistry.register("5c9f512f96c1a50004819786", {});
WidgetQueryGeneratorRegistry.register("6080f9266b8cfd602957ba72", {});
//
