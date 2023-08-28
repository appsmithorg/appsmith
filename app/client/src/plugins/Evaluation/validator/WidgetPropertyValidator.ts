import { PropertyValidator } from ".";
import type { IEntity } from "plugins/Common/entity";

export class WidgetPropertyValidator extends PropertyValidator {
  private static _instance: WidgetPropertyValidator;
  constructor() {
    if (WidgetPropertyValidator._instance) {
      return WidgetPropertyValidator._instance;
    }
    super();
    WidgetPropertyValidator._instance = this;
  }
  validate(
    value: unknown,
    entity: IEntity,
    path: string,
    validationConfig?: unknown,
  ) {
    
  }
}
