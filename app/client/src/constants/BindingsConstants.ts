/* eslint-disable no-useless-escape */
// TODO (hetu): Remove useless escapes and re-enable the above lint rule
export type NamePathBindingMap = Record<string, string>;
export const DATA_BIND_REGEX = /{{([\s\S]*?)}}/g;
export const AUTOCOMPLETE_MATCH_REGEX = /{{\s*.*?\s*}}/g;
/* eslint-enable no-useless-escape */
