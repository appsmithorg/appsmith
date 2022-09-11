import {
  DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
  JAVASCRIPT_KEYWORDS,
} from "constants/WidgetValidation";
import { merge } from "lodash";
import { extraLibrariesNames } from "utils/DynamicBindingUtils";

export const CURRENT_EVALUATION_VERSION = 2;

export const invalidEntityIdentifiers = merge(JAVASCRIPT_KEYWORDS, [
  DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
  extraLibrariesNames,
]);
