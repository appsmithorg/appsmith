import { createMessage, FIELD_REQUIRED_ERROR } from "constants/messages";

export const required = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return createMessage(FIELD_REQUIRED_ERROR);
  }
};
