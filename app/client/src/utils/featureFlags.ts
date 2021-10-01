import FeatureFlag from "entities/FeatureFlag";

export default function getFeatureFlags(): FeatureFlag {
  const flags = (window as any).FEATURE_FLAGS || {};
  return {
    ...flags,
    BOTTOM_BAR: true,
  };
}
