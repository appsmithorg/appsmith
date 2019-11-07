/* eslint-disable no-useless-escape */
// TODO (hetu): Remove useless escapes and re-enable the above lint rule
export type NamePathBindingMap = Record<string, string>;
export const DATA_BIND_REGEX = /{{(\s*[\w\.\[\]\d]+\s*)}}/g;
export const DATA_PATH_REGEX = /[\w\.\[\]\d]+/;
