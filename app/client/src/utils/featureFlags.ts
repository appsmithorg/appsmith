import FeatureFlag from "entities/FeatureFlag";

export default function getFeatureFlags(): FeatureFlag {
  // TODO remove
  return (window as any).FEATURE_FLAGS || { GIT: true, JS_EDITOR: true };
}
