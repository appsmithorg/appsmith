import { body } from "express-validator";

export default class AstValidator {
  static getScriptValidator = () =>
    body("script")
      .isString()
      .withMessage("Script is required and can only be a string");

  static getMultipleScriptValidator = () =>
    body("scripts")
      .isArray({
        min: 1,
      })
      .withMessage("Multiple scripts are required");
}
