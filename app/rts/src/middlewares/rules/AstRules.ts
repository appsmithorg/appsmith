import { body } from "express-validator";

const getAst = () =>
  body("payload")
    .exists()
    .isString()
    .withMessage("Payload can only be a string");

export default {
  getAst,
};
