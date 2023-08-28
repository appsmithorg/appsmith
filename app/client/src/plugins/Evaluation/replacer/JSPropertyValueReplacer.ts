import type { IEntity } from "plugins/Common/entity";
import { Replacer } from ".";

export class JSPropertyValueReplacer extends Replacer {
  private static _instance: JSPropertyValueReplacer;
  constructor() {
    if (JSPropertyValueReplacer._instance) {
      return JSPropertyValueReplacer._instance;
    }
    super();
    JSPropertyValueReplacer._instance = this;
  }
  replace(value: unknown, entity: IEntity, path: string): unknown {
    return value;
  }
}
