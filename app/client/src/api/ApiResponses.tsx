export type APIResponseError = {
  code: number;
  message: string;
};

export type ResponseMeta = {
  status: number;
  success: boolean;
  error?: APIResponseError;
};

export type ApiResponse = {
  responseMeta: ResponseMeta;
  data: any;
  code?: string;
};

export type GenericApiResponse<T> = {
  responseMeta: ResponseMeta;
  data: T;
};

// NO_DATASOURCES_FOUND, 1000, "Unable to find {0} with id {1}"
// INVALID_PARAMTER, 4000, "Invalid parameter {0} provided in the input"
// PLUGIN_NOT_INSTALLED, 4001, "Plugin {0} not installed"
// MISSING_PLUGIN_ID, 4002, "Missing plugin id. Please input correct plugin id"
// MISSING_DATASOURCES_ID, 4003, "Missing datasource id. Please input correct datasource id"
// MISSING_PAGE_ID, 4004, "Missing page id. Pleaes input correct page id"
// PAGE_DOES_NOT_EXIST_IN_ORG, 4006, "Page {0} does not belong to the current user {1} organization."
// UNAUTHORIZED_DOMAIN, 4001, "Invalid email domain provided. Please sign in with a valid work email ID"
// INTERNAL_SERVER_ERROR, 5000, "Internal server error while processing request"
// REPOSITORY_SAVE_FAILED, 5001, "Repository save failed."
