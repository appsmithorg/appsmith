import { type IEntity } from "plugins/Common/entity";
import { Replacer } from ".";


export class WidgetPropertyValueReplacer extends Replacer {
  private static _instance: WidgetPropertyValueReplacer;
  constructor() {
    if (WidgetPropertyValueReplacer._instance) {
      return WidgetPropertyValueReplacer._instance;
    }
    super();
    WidgetPropertyValueReplacer._instance = this;
  }
  replace(value: unknown, entity: IEntity, path: string): unknown {
    return value;
  }
}
