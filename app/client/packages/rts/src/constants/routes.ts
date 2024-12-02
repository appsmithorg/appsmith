const BASE_API_URL = "http://localhost:8091";

export const RTS_BASE_API_PATH = "/rts-api/v1";
export const RTS_BASE_API_URL = `${BASE_API_URL}${RTS_BASE_API_PATH}`;

export const BASE_APPSMITH_API_URL =
  process.env.APPSMITH_API_BASE_URL || "http://localhost:8080/api/v1";
export const INTERNAL_BASE_URL = "http://localhost:8080/internal/v1";
