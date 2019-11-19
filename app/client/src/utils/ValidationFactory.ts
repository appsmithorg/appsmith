import { WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "./WidgetFactory";
import { ValidationType, Validator } from "../constants/WidgetValidation";

// TODO: need to be strict about what the key can be
export type WidgetPropertyValidationType = Record<string, ValidationType>;

class ValidationFactory {
  static validationMap: Map<ValidationType, Validator> = new Map();

  static registerValidator(
    validationType: ValidationType,
    validator: Validator,
  ) {
    this.validationMap.set(validationType, validator);
  }

  static validateWidgetProperty(
    widgetType: WidgetType,
    property: string,
    value: any,
  ) {
    let isValid = true;
    const propertyValidationTypes = WidgetFactory.getWidgetPropertyValidationMap(
      widgetType,
    );
    const validationType = propertyValidationTypes[property];
    const validator = this.validationMap.get(validationType);
    if (validator) {
      isValid = validator(value);
    }
    return isValid;
  }
}

export default ValidationFactory;
