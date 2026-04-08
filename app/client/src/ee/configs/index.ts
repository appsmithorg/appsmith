export * from "ce/configs/index";
import type { EvaluationVersion } from "constants/EvalConstants";
import type { INJECTED_CONFIGS } from "ce/configs/index";

declare global {
  interface Window {
    APPSMITH_FEATURE_CONFIGS: INJECTED_CONFIGS;
    // Pylon chat widget (https://docs.usepylon.com/pylon-docs/chat-widget/javascript-api)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Pylon: any;
    pylon?: {
      chat_settings: {
        app_id: string;
        email?: string;
        name?: string;
        avatar_url?: string;
        account_external_id?: string;
      };
    };
    evaluationVersion: EvaluationVersion;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Sentry: any;
  }
}
