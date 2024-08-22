import type { FeatureFlags } from "ee/entities/FeatureFlag";

export class WorkerEnv {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
