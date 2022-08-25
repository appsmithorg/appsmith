import { body } from "express-validator";

const getScriptValidator = () =>
  body("script")
    .isString()
    .withMessage("Script is required and can only be a string");

export default {
  getScriptValidator,
};
