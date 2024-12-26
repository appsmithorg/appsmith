import type { FeatureFlags } from "ee/entities/FeatureFlag";

export class WorkerEnv {
  static flags: FeatureFlags = {} as FeatureFlags;
  static cloudHosting: boolean;

  static setFeatureFlags(featureFlags: FeatureFlags) {
    WorkerEnv.flags = featureFlags;
  }

  static setCloudHosting(cloudHosting: boolean) {
    WorkerEnv.cloudHosting = cloudHosting;
  }

  static getFeatureFlags() {
    return WorkerEnv.flags;
  }

  static getCloudHosting() {
    return WorkerEnv.cloudHosting;
  }
}
