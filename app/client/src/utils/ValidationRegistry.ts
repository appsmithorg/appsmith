import ValidationFactory from "./ValidationFactory";
import { VALIDATION_TYPES } from "../constants/WidgetValidation";
import { VALIDATORS } from "./Validators";

class ValidationRegistry {
  static registerInternalValidators() {
    ValidationFactory.registerValidator(
      VALIDATION_TYPES.TEXT,
      VALIDATORS[VALIDATION_TYPES.TEXT],
    );

    ValidationFactory.registerValidator(
      VALIDATION_TYPES.NUMBER,
      VALIDATORS[VALIDATION_TYPES.NUMBER],
    );

    ValidationFactory.registerValidator(
      VALIDATION_TYPES.BOOLEAN,
      VALIDATORS[VALIDATION_TYPES.BOOLEAN],
    );

    ValidationFactory.registerValidator(
      VALIDATION_TYPES.OBJECT,
      VALIDATORS[VALIDATION_TYPES.OBJECT],
    );

    ValidationFactory.registerValidator(
      VALIDATION_TYPES.TABLE_DATA,
      VALIDATORS[VALIDATION_TYPES.TABLE_DATA],
    );
  }
}

export default ValidationRegistry;
