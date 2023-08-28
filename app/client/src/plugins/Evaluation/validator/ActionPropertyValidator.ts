import type { IEntity } from "plugins/Common/entity";
import { PropertyValidator } from ".";
import { validateActionProperty } from "workers/common/DataTreeEvaluator/validationUtils";
import type { ValidationResponse } from "constants/WidgetValidation";

export class ActionPropertyValidator extends PropertyValidator {
  private static _instance: ActionPropertyValidator;
  constructor() {
    if (ActionPropertyValidator._instance) {
      return ActionPropertyValidator._instance;
    }
    super();
    ActionPropertyValidator._instance = this;
  }
  validate(
    value: unknown,
    entity: IEntity,
    path: string,
    validationConfig?: any,
  ): ValidationResponse {
    if (!validationConfig) return { isValid: true, parsed: value };
    const id = entity.getId();
    const configProperty = path.replace("config", "actionConfiguration");
    const pathValidationConfig = validationConfig[id]?.[configProperty];
    if (!pathValidationConfig) return { isValid: true, parsed: value };
    if (!value) return { isValid: true, parsed: value };
    // runs VALIDATOR function and returns errors
    return validateActionProperty(validationConfig, value);
  }
}
