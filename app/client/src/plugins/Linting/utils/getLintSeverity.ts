import {
  asyncActionInSyncFieldLintMessage,
  WARNING_LINT_ERRORS,
} from "../constants";
import { Severity } from "entities/AppsmithConsole";

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
