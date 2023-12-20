export const BASE_PACKAGE_EDITOR_PATH = "/pkg";
export const PACKAGE_EDITOR_PATH = `${BASE_PACKAGE_EDITOR_PATH}/:packageId`;
export const MODULE_EDITOR_BASE_PATH = `${PACKAGE_EDITOR_PATH}/:moduleId`;
export const MODULE_EDITOR_PATH = `${MODULE_EDITOR_BASE_PATH}/edit`;

export const MODULE_QUERY_EDITOR_PATH = `/queries/:queryId`;
export const MODULE_API_EDITOR_PATH = `/api/:apiId`;
export const MODULE_CURL_IMPORT_PATH = `/api/curl/curl-import`;

export const MODULE_JS_COLLECTION_EDITOR_PATH = `/jsObjects/:collectionId`;
