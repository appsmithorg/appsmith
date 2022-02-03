import FeatureFlag from "entities/FeatureFlag";

export default function getFeatureFlags(): FeatureFlag {
  return (window as any).FEATURE_FLAGS || {};
}
