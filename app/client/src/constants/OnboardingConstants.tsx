import { endOnboarding, showIndicator } from "actions/onboardingActions";
import { ReduxActionTypes } from "./ReduxActionConstants";

export enum OnboardingStep {
  NONE = -1,
  WELCOME = 0,
  EXAMPLE_DATABASE = 1,
  RUN_QUERY_SUCCESS = 2,
  ADD_WIDGET = 3,
  SUCCESSFUL_BINDING = 4,
  DEPLOY = 5,
  FINISH = 6,
}

export type OnboardingHelperConfig = {
  step?: number;
  title: string;
  description?: string;
  skipLabel?: string;
  snippet?: string;
  action: {
    label: string;
    // action to be dispatched
    action?: { type: string; payload?: any };
    initialStep?: boolean;
  };
  cheatAction?: {
    label: string;
    action: { type: string; payload?: any };
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
          payload: true,
        },
      ];
    },
    helper: {
      title: "👋 Welcome to Appsmith!",
      description:
        "Let's build an app for remote teams to do async update meetings",
      skipLabel: "No thanks",
      action: {
        label: "Let’s go",
        action: {
          type: "ONBOARDING_CREATE_APPLICATION",
        },
        initialStep: true,
      },
    },
  },
  [OnboardingStep.EXAMPLE_DATABASE]: {
    name: "EXAMPLE_DATABASE",
    setup: () => {
      return [
        {
          type: ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_INIT,
        },
        {
          type: ReduxActionTypes.LISTEN_FOR_CREATE_ACTION,
        },
      ];
    },
    helper: {
      step: 1,
      title: "Query the Super Updates DB",
      description:
        "A select query can fetch us updates from heroes all across the multiverse.",
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.EXAMPLE_DATABASE),
      },
      cheatAction: {
        label: "Super Hack",
        action: {
          type: "ONBOARDING_CREATE_QUERY",
        },
      },
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
    helper: {
      step: 2,
      title: "Build the Standup Dashboard",
      description:
        "Drag a table so that heroes can view each other's updates and plan their crime-fighting days",
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.RUN_QUERY_SUCCESS),
      },
      cheatAction: {
        label: "Super Hack",
        action: {
          type: "ONBOARDING_ADD_WIDGET",
        },
      },
    },
  },
  [OnboardingStep.ADD_WIDGET]: {
    name: "ADD_WIDGET",
    setup: () => {
      return [];
    },
    helper: {
      step: 3,
      title: "Write a binding to connect TableData",
      description:
        "Use the snippet below to connect TableData to example query.",
      snippet: "{{ExampleQuery.data}}",
      action: {
        label: "Continue",
      },
      cheatAction: {
        label: "Cheat",
        action: {
          type: "ONBOARDING_ADD_BINDING",
        },
      },
    },
  },
  [OnboardingStep.SUCCESSFUL_BINDING]: {
    name: "SUCCESSFUL_BINDING",
    setup: () => {
      return [];
    },
    helper: {
      step: 4,
      title: "Deploy your app",
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.SUCCESSFUL_BINDING),
      },
      cheatAction: {
        label: "Cheat",
        action: {
          type: "ONBOARDING_DEPLOY",
        },
      },
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
    helper: {
      step: 5,
      title:
        "Great Job! You built an active app that display data from a database.",
      description:
        "Simple isn’t it. You’ve learnt -\n- How to query a database.\n- How to connect response to widget.\n- Deploying your app.",
      action: {
        label: "End Tour",
        action: endOnboarding(),
      },
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
