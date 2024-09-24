import {
  createMessage,
  FORM_VALIDATION_INVALID_EMAIL,
} from "../constants/messages";

const isEmail = (value: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return re.test(value);
};

export function emailValidator(email: string) {
  let isValid = true;

  if (email) {
    isValid = isEmail(email);
  }

  return {
    isValid: isValid,
    message: !isValid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : "",
  };
}
