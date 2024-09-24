import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { WorkerEnv } from "workers/Evaluation/handlers/workerEnv";
import type { LintRequest } from "../types";

export const setupLintingWorkerEnv = ({
  data: featureFlags,
}: LintRequest<FeatureFlags>) => {
  WorkerEnv.setFeatureFlags(featureFlags);
};
