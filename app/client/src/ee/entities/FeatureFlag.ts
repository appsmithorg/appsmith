export * from "ce/entities/FeatureFlag";
import {
  FEATURE_FLAG as CE_FEATURE_FLAG,
  DEFAULT_FEATURE_FLAG_VALUE as CE_DEFAULT_FEATURE_FLAG_VALUE,
} from "ce/entities/FeatureFlag";

const EE_FEATURE_FLAG = {
  TEST_EE_FLAG: "TEST_EE_FLAG",
  license_audit_logs_enabled: "license_audit_logs_enabled",
  license_session_limit_enabled: "license_session_limit_enabled",
} as const;

export const EE_DEFAULT_FEATURE_FLAG_VALUE: EE_FeatureFlags = {
  TEST_EE_FLAG: true,
  license_audit_logs_enabled: false,
  license_session_limit_enabled: false,
};

export type EE_FeatureFlag = keyof typeof EE_FEATURE_FLAG;
export type EE_FeatureFlags = Record<EE_FeatureFlag, boolean>;

export const FEATURE_FLAG = {
  ...CE_FEATURE_FLAG,
  ...EE_FEATURE_FLAG,
} as const;

export const DEFAULT_FEATURE_FLAG_VALUE = {
  ...CE_DEFAULT_FEATURE_FLAG_VALUE,
  ...EE_DEFAULT_FEATURE_FLAG_VALUE,
};

export type FeatureFlag = keyof typeof FEATURE_FLAG;
export type FeatureFlags = Record<FeatureFlag, boolean>;
