import { ActionPropertyValidator } from "./ActionPropertyValidator";
import { WidgetPropertyValidator } from "./WidgetPropertyValidator";
import { EntityUtils } from "plugins/Common/utils/entityUtils";
import type { IEntity } from "plugins/Common/entity";

export abstract class PropertyValidator {
  abstract validate(
    value: unknown,
    entity: IEntity,
    path: string,
    validationConfig?: unknown,
  ): unknown;
}

export class DefaultValidator extends PropertyValidator {
  private static _instance: DefaultValidator;
  constructor() {
    if (DefaultValidator._instance) {
      return DefaultValidator._instance;
    }
    super();
    DefaultValidator._instance = this;
  }
  validate(value: unknown) {
    return value;
  }
}

export class ValidatorFactory {
  static getValidator(entity: IEntity) {
    if (EntityUtils.isWidget(entity)) {
      return new WidgetPropertyValidator();
    } else if (EntityUtils.isAction(entity)) {
      return new ActionPropertyValidator();
    }
    return new DefaultValidator();
  }
}
