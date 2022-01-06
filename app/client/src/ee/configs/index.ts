export * from "ce/configs/index";
import { EvaluationVersion } from "api/ApplicationApi";
import { INJECTED_CONFIGS } from "ce/configs/index";

declare global {
  interface Window {
    APPSMITH_FEATURE_CONFIGS: INJECTED_CONFIGS;
    Intercom: any;
    evaluationVersion: EvaluationVersion;
    Sentry: any;
  }
}
