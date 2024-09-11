export * from "ce/configs/index";
import type { EvaluationVersion } from "constants/EvalConstants";
import type { INJECTED_CONFIGS } from "ce/configs/index";

declare global {
  interface Window {
    APPSMITH_FEATURE_CONFIGS: INJECTED_CONFIGS;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Intercom: any;
    evaluationVersion: EvaluationVersion;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Sentry: any;
  }
}
