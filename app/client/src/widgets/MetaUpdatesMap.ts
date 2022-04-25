import { MetaUpdates, DebouncedExecuteActionPayload } from "./BaseWidget";
class MetaUpdatesMap {
  metaUpdates: MetaUpdates = [];

  add(
    propertyName: string,
    propertyValue: unknown,
    actionExecution?: DebouncedExecuteActionPayload,
  ) {
    this.metaUpdates.push({
      propertyName,
      propertyValue,
      actionExecution,
    });
    return this;
  }

  toArray() {
    return this.metaUpdates;
  }
}

export default MetaUpdatesMap;
