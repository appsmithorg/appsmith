export const IDE_BASE = "/ide/:appId/page/:pageId";
export const IDE_PATH = `${IDE_BASE}/:ideState`;

export const IDE_DATA_PATH = `${IDE_BASE}/data`;
export const IDE_DATA_DETAIL_PATH = `${IDE_DATA_PATH}/:dataId`;
export const IDE_PAGE_PATH = `${IDE_BASE}/page/:pageId`;
export const IDE_PAGE_NAV_PATH = `${IDE_PAGE_PATH}/:pageNav`;
export const IDE_PAGE_UI_PATH = `${IDE_PAGE_PATH}/ui`;
export const IDE_PAGE_UI_DETAIL_PATH = `${IDE_PAGE_PATH}/ui/:widgetIds`;
export const IDE_PAGE_QUERIES_PATH = `${IDE_PAGE_PATH}/queries`;
export const IDE_PAGE_QUERIES_DETAIL_PATH = `${IDE_PAGE_PATH}/queries/:actionId`;
export const IDE_PAGE_JS_PATH = `${IDE_PAGE_PATH}/js`;
export const IDE_PAGE_JS_DETAIL_PATH = `${IDE_PAGE_PATH}/js/:collectionId`;
export const IDE_ADD_PATH = `${IDE_BASE}/add`;
export const IDE_LIB_PATH = `${IDE_BASE}/libs`;

export const IDE_SETTINGS_PATH = `${IDE_BASE}/settings`;
