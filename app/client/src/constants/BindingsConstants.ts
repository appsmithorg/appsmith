import XRegExp from "xregexp";

export const DATA_BIND_REGEX = /{{([\s\S]*?)}}/;
export const DATA_BIND_REGEX_GLOBAL = /{{([\s\S]*?)}}/g;
export const AUTOCOMPLETE_MATCH_REGEX = XRegExp("(?<!{){{|}}(?!})", "g");
export const QUOTED_BINDING_REGEX = /["']({{[\s\S]*?}})["']/g;
