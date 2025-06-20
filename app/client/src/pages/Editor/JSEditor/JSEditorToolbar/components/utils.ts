import {
  ActionRunBehaviour,
  type ActionRunBehaviourType,
} from "PluginActionEditor/types/PluginActionTypes";
import { RUN_BEHAVIOR_VALUES } from "constants/AppsmithActionConstants/formConfig/PluginSettings";

import { type SelectOptionProps } from "@appsmith/ads";

export const getRunBehaviorOptionsBasedOnFeatureFlags = (
  isReactiveActionsEnabled: boolean,
  isOnPageUnloadEnabled: boolean,
) =>
  RUN_BEHAVIOR_VALUES.filter(
    (option) =>
      (isReactiveActionsEnabled ||
        option.value !== ActionRunBehaviour.AUTOMATIC) &&
      (isOnPageUnloadEnabled ||
        option.value !== ActionRunBehaviour.ON_PAGE_UNLOAD),
  ) as SelectOptionProps[];

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
