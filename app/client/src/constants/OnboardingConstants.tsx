import { ReduxActionTypes } from "./ReduxActionConstants";

export enum OnboardingStep {
  NONE = -1,
  WELCOME = 0,
  EXAMPLE_DATABASE = 1,
  RUN_QUERY = 2,
  RUN_QUERY_SUCCESS = 3,
  ADD_WIDGET = 4,
  SUCCESSFUL_BINDING = 5,
  DEPLOY = 6,
  FINISH = 7,
}

export type OnboardingHelperConfig = {
  title: string;
  description?: string;
  skipLabel?: string;
  action: {
    label: string;
  };
};

export type OnboardingStepConfig = {
  name: string;
  setup: () => { type: string; payload?: any }[];
  helper?: OnboardingHelperConfig;
};

export const OnboardingConfig: Record<OnboardingStep, OnboardingStepConfig> = {
  [OnboardingStep.NONE]: {
    name: "NONE",
    setup: () => {
      return [];
    },
  },
  [OnboardingStep.WELCOME]: {
    name: "WELCOME",
    setup: () => {
      // To setup the state if any
      // Return action that needs to be dispatched
      return [
        {
          type: ReduxActionTypes.SHOW_WELCOME,
        },
      ];
    },
    helper: {
      title: "",
      description:
        "Let’s get you started with Appsmith. We’d like to show you around by building an app that talks to a database. It’ll only take a minute or two.",
      skipLabel: "No thanks",
      action: {
        label: "Let’s go",
      },
    },
  },
  [OnboardingStep.EXAMPLE_DATABASE]: {
    name: "EXAMPLE_DATABASE",
    setup: () => {
      return [
        {
          type: ReduxActionTypes.SHOW_WELCOME,
        },
        {
          type: ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_INIT,
        },
        {
          type: ReduxActionTypes.LISTEN_FOR_CREATE_ACTION,
        },
      ];
    },
  },
  [OnboardingStep.RUN_QUERY]: {
    name: "RUN_QUERY",
    setup: () => {
      return [];
    },
  },
  [OnboardingStep.RUN_QUERY_SUCCESS]: {
    name: "RUN_QUERY_SUCCESS",
    setup: () => {
      return [
        {
          type: ReduxActionTypes.LISTEN_FOR_ADD_WIDGET,
        },
        {
          type: ReduxActionTypes.LISTEN_FOR_TABLE_WIDGET_BINDING,
        },
      ];
    },
  },
  [OnboardingStep.ADD_WIDGET]: {
    name: "ADD_WIDGET",
    setup: () => {
      return [];
    },
  },
  [OnboardingStep.SUCCESSFUL_BINDING]: {
    name: "SUCCESSFUL_BINDING",
    setup: () => {
      return [];
    },
  },
  [OnboardingStep.DEPLOY]: {
    name: "DEPLOY",
    setup: () => {
      return [
        {
          type: ReduxActionTypes.LISTEN_FOR_DEPLOY,
        },
      ];
    },
  },
  // Final step
  [OnboardingStep.FINISH]: {
    name: "FINISH",
    setup: () => {
      return [];
    },
  },
};
