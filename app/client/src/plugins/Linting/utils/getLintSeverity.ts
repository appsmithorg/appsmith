import { Severity } from "entities/AppsmithConsole";

import {
  WARNING_LINT_ERRORS,
  asyncActionInSyncFieldLintMessage,
} from "../constants";

export default function getLintSeverity(
  code: string,
  errorMessage: string,
): Severity.WARNING | Severity.ERROR {
  const severity =
    code in WARNING_LINT_ERRORS ||
    errorMessage === asyncActionInSyncFieldLintMessage(true)
      ? Severity.WARNING
      : Severity.ERROR;
  return severity;
}
