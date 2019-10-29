import { API_PATH_START_WITH_SLASH_ERROR } from "../../constants/validations";

export const apiPathValidation = (value: string) => {
  if (value.startsWith("/")) return API_PATH_START_WITH_SLASH_ERROR;
};
