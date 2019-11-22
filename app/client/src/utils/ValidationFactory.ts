import { WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "./WidgetFactory";
import {
  ValidationResponse,
  ValidationType,
  Validator,
} from "../constants/WidgetValidation";

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
  ): ValidationResponse {
    const propertyValidationTypes = WidgetFactory.getWidgetPropertyValidationMap(
      widgetType,
    );
    const validationType = propertyValidationTypes[property];
    const validator = this.validationMap.get(validationType);
    if (validator) {
      return validator(value);
    } else {
      return { isValid: true, parsed: value };
    }
  }
}

export default ValidationFactory;
