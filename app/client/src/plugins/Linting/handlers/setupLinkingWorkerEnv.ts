import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { WorkerEnv } from "workers/Evaluation/handlers/workerEnv";

export const setupLintingWorkerEnv = (featureFlags: FeatureFlags) => {
  WorkerEnv.setFeatureFlags(featureFlags);
};
