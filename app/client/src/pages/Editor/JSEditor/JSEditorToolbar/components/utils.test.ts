import {
  ActionRunBehaviour,
  type ActionRunBehaviourType,
} from "PluginActionEditor/types/PluginActionTypes";
import {
  getDefaultRunBehaviorOptionWhenFeatureFlagIsDisabled,
  getRunBehaviorOptionsBasedOnFeatureFlags,
} from "./utils";
import { JS_OBJECT_RUN_BEHAVIOR_VALUES } from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import type { SelectOptionProps } from "@appsmith/ads";

describe("getRunBehaviorOptions", () => {
  it("should return the correct options", () => {
    const flagsOutputMatrix: {
      isReactiveActionsEnabled: boolean;
      isOnPageUnloadEnabled: boolean;
      expectedOptions: SelectOptionProps[];
    }[] = [
      {
        isReactiveActionsEnabled: true,
        isOnPageUnloadEnabled: true,
        expectedOptions: JS_OBJECT_RUN_BEHAVIOR_VALUES,
      },
      {
        isReactiveActionsEnabled: false,
        isOnPageUnloadEnabled: true,
        expectedOptions: JS_OBJECT_RUN_BEHAVIOR_VALUES.filter(
          (option) => option.value !== ActionRunBehaviour.AUTOMATIC,
        ),
      },
      {
        isReactiveActionsEnabled: true,
        isOnPageUnloadEnabled: false,
        expectedOptions: JS_OBJECT_RUN_BEHAVIOR_VALUES.filter(
          (option) => option.value !== ActionRunBehaviour.ON_PAGE_UNLOAD,
        ),
      },
      {
        isReactiveActionsEnabled: false,
        isOnPageUnloadEnabled: false,
        expectedOptions: JS_OBJECT_RUN_BEHAVIOR_VALUES.filter(
          (option) =>
            option.value !== ActionRunBehaviour.AUTOMATIC &&
            option.value !== ActionRunBehaviour.ON_PAGE_UNLOAD,
        ),
      },
    ];

    flagsOutputMatrix.forEach(
      ({
        expectedOptions,
        isOnPageUnloadEnabled,
        isReactiveActionsEnabled,
      }) => {
        const options = getRunBehaviorOptionsBasedOnFeatureFlags(
          isReactiveActionsEnabled,
          isOnPageUnloadEnabled,
        );

        expect(options).toEqual(expectedOptions);
      },
    );
  });
});

describe("getDefaultRunBehaviorOptionWhenFeatureFlagIsDisabled", () => {
  const onPageLoadOption =
    JS_OBJECT_RUN_BEHAVIOR_VALUES.find(
      (option) => option.value === ActionRunBehaviour.ON_PAGE_LOAD,
    ) ?? null;
  const manualOption =
    JS_OBJECT_RUN_BEHAVIOR_VALUES.find(
      (option) => option.value === ActionRunBehaviour.MANUAL,
    ) ?? null;

  const flagsOutputMatrix: {
    runBehaviour: ActionRunBehaviourType;
    isReactiveActionsEnabled: boolean;
    isOnPageUnloadEnabled: boolean;
    expectedOption: SelectOptionProps | null;
  }[] = [
    {
      runBehaviour: ActionRunBehaviour.AUTOMATIC,
      isReactiveActionsEnabled: true,
      isOnPageUnloadEnabled: true,
      expectedOption: null,
    },
    {
      runBehaviour: ActionRunBehaviour.AUTOMATIC,
      isReactiveActionsEnabled: false,
      isOnPageUnloadEnabled: true,
      expectedOption: onPageLoadOption,
    },
    {
      runBehaviour: ActionRunBehaviour.AUTOMATIC,
      isReactiveActionsEnabled: true,
      isOnPageUnloadEnabled: false,
      expectedOption: null,
    },
    {
      runBehaviour: ActionRunBehaviour.AUTOMATIC,
      isReactiveActionsEnabled: false,
      isOnPageUnloadEnabled: false,
      expectedOption: onPageLoadOption,
    },
    {
      runBehaviour: ActionRunBehaviour.ON_PAGE_UNLOAD,
      isReactiveActionsEnabled: true,
      isOnPageUnloadEnabled: true,
      expectedOption: null,
    },
    {
      runBehaviour: ActionRunBehaviour.ON_PAGE_UNLOAD,
      isReactiveActionsEnabled: false,
      isOnPageUnloadEnabled: true,
      expectedOption: null,
    },
    {
      runBehaviour: ActionRunBehaviour.ON_PAGE_UNLOAD,
      isReactiveActionsEnabled: true,
      isOnPageUnloadEnabled: false,
      expectedOption: manualOption,
    },
    {
      runBehaviour: ActionRunBehaviour.ON_PAGE_UNLOAD,
      isReactiveActionsEnabled: false,
      isOnPageUnloadEnabled: false,
      expectedOption: manualOption,
    },
  ];

  it("should return the correct options", () => {
    flagsOutputMatrix.forEach(
      ({
        expectedOption,
        isOnPageUnloadEnabled,
        isReactiveActionsEnabled,
        runBehaviour,
      }) => {
        const option = getDefaultRunBehaviorOptionWhenFeatureFlagIsDisabled(
          runBehaviour,
          isReactiveActionsEnabled,
          isOnPageUnloadEnabled,
          JS_OBJECT_RUN_BEHAVIOR_VALUES,
        );

        expect(option).toEqual(expectedOption);
      },
    );
  });
});
