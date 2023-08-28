import { ENTITY_TYPE, type IEntity } from "plugins/Common/entity";
import { WidgetPropertyValueReplacer } from "./WidgetPropertyValueReplacer";
import { JSPropertyValueReplacer } from "./JSPropertyValueReplacer";

export abstract class Replacer {
  abstract replace(value: unknown, entity: IEntity, path: string): unknown;
}

export class ReplacerFactory {
  static getReplacer(entity: IEntity): Replacer {
    const type = entity.getType();
    if (type === ENTITY_TYPE.WIDGET) {
      return new WidgetPropertyValueReplacer();
    } else if (type === ENTITY_TYPE.ACTION) {
      return new JSPropertyValueReplacer();
    }
    return new DefaultReplacer();
  }
}

class DefaultReplacer extends Replacer {
  // singleton
  private static _instance: DefaultReplacer;
  constructor() {
    if (DefaultReplacer._instance) {
      return DefaultReplacer._instance;
    }
    super();
    DefaultReplacer._instance = this;
  }
  replace(value: unknown, entity: IEntity, path: string): unknown {
    return value;
  }
}
