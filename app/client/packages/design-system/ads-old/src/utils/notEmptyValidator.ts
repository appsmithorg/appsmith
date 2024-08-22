import { ERROR_MESSAGE_NAME_EMPTY, createMessage } from "../constants/messages";

export function notEmptyValidator(value: string) {
  const isValid = !!value;
  return {
    isValid: isValid,
    message: !isValid ? createMessage(ERROR_MESSAGE_NAME_EMPTY) : "",
  };
}
