import { API_PATH_START_WITH_SLASH_ERROR } from "constants/ValidationsMessages";

export const apiPathValidation = (value: string) => {
  if (value && value.startsWith("/")) return API_PATH_START_WITH_SLASH_ERROR;
};
