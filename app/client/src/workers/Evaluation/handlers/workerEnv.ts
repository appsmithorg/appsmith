import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

export class WorkerEnv {
  static flags: any;
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
