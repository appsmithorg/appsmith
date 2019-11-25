import ValidationFactory from "./ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { VALIDATORS } from "./Validators";

class ValidationRegistry {
  static registerInternalValidators() {
    Object.keys(VALIDATION_TYPES).forEach(type => {
      ValidationFactory.registerValidator(type, VALIDATORS[type]);
    });
  }
}

export default ValidationRegistry;
