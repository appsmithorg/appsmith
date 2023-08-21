export const IDE_BASE = "/ide";
export const IDE_PATH = `${IDE_BASE}/:applicationSlug/:ideState`;

export const IDE_PAGE_PATH = `${IDE_PATH}/:pageSlug(.*-):pageId`;

export const IDE_DATA_PATH = `${IDE_PATH}/:datasourceId`;
