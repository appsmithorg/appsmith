import { endOnboarding, showIndicator } from "actions/onboardingActions";
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
  step?: number;
  title: string;
  description?: string;
  skipLabel?: string;
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
        },
      ];
    },
    helper: {
      title: "Welcome Fellow Appsmith!",
      description:
        "We'd like to show you around by helping you build an app that saves the world from daily meetings. It'll only take a min or 2.",
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
      title: "Create a New Query",
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.EXAMPLE_DATABASE),
      },
      cheatAction: {
        label: "Cheat",
        action: {
          type: "ONBOARDING_CREATE_QUERY",
        },
      },
    },
  },
  [OnboardingStep.RUN_QUERY]: {
    name: "RUN_QUERY",
    setup: () => {
      return [];
    },
    helper: {
      step: 2,
      title: "Run Query to get a response",
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.RUN_QUERY),
      },
      cheatAction: {
        label: "Cheat",
        action: {
          type: "ONBOARDING_RUN_QUERY",
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
      step: 3,
      title: "Click Add widget to build a UI",
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.RUN_QUERY_SUCCESS),
      },
      cheatAction: {
        label: "Cheat",
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
      step: 4,
      title: "Write a binding to connect TableData",
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
      step: 5,
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
      step: 6,
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
