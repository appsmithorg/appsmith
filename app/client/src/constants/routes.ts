export const BASE_URL = "/";
export const LOGIN_URL = "/login";
export const BUILDER_URL = "/builder";
export const API_EDITOR_URL = `${BUILDER_URL}/api`;
export const API_EDITOR_ID_URL = (id = ":id") => `${API_EDITOR_URL}/${id}`;
