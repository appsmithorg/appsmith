export const FUNC_ARGS_REGEX =
  /((["][^"]*["])|([\[][\s\S]*[\]])|([\{][\s\S]*[\}])|(['][^']*['])|([\(][\s\S]*[\)][ ]*=>[ ]*[{][\s\S]*[}])|([^'",][^,"+]*[^'",]*))*/gi;

//Old Regex:: /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;
export const ACTION_TRIGGER_REGEX = /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g;

export const ACTION_ANONYMOUS_FUNC_REGEX =
  /\(\) => (({[\s\S]*?})|([\s\S]*?)(\([\s\S]*?\)))/g;

export const IS_URL_OR_MODAL = /^'.*'$/;
