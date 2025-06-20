import {
  ActionRunBehaviour,
  type ActionRunBehaviourType,
} from "PluginActionEditor/types/PluginActionTypes";
import { JS_OBJECT_RUN_BEHAVIOR_VALUES } from "constants/AppsmithActionConstants/formConfig/PluginSettings";

import { type SelectOptionProps } from "@appsmith/ads";
/**
 * Returns the list of run behavior options based on the current feature flags.
 * - If reactive actions are disabled, removes AUTOMATIC.
 * - If onPageUnload is disabled, removes ON_PAGE_UNLOAD.
 */
export const getRunBehaviorOptionsBasedOnFeatureFlags = (
  isReactiveActionsEnabled: boolean,
  isOnPageUnloadEnabled: boolean,
) =>
  JS_OBJECT_RUN_BEHAVIOR_VALUES.filter(
    (option) =>
      (isReactiveActionsEnabled ||
        option.value !== ActionRunBehaviour.AUTOMATIC) &&
      (isOnPageUnloadEnabled ||
        option.value !== ActionRunBehaviour.ON_PAGE_UNLOAD),
  ) as SelectOptionProps[];

/**
 * Returns the default run behavior option if the current one is no longer available due to feature flag changes.
 * - AUTOMATIC falls back to ON_PAGE_LOAD if reactive actions are disabled.
 * - ON_PAGE_UNLOAD falls back to MANUAL if onPageUnload is disabled.
 */
export const getDefaultRunBehaviorOptionWhenFeatureFlagIsDisabled = (
  runBehaviour: ActionRunBehaviourType,
  isReactiveActionsEnabled: boolean,
  isOnPageUnloadEnabled: boolean,
  options: SelectOptionProps[],
): SelectOptionProps | null => {
  if (
    runBehaviour === ActionRunBehaviour.AUTOMATIC &&
    !isReactiveActionsEnabled
  ) {
    return (
      options.find((opt) => opt.value === ActionRunBehaviour.ON_PAGE_LOAD) ??
      null
    );
  }

  if (
    runBehaviour === ActionRunBehaviour.ON_PAGE_UNLOAD &&
    !isOnPageUnloadEnabled
  ) {
    return (
      options.find((opt) => opt.value === ActionRunBehaviour.MANUAL) ?? null
    );
  }

  return null;
};
