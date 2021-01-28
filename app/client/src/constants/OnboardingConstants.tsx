import { endOnboarding, showIndicator } from "actions/onboardingActions";
import { ReduxActionTypes } from "./ReduxActionConstants";

export enum OnboardingStep {
  NONE = -1,
  WELCOME = 0,
  EXAMPLE_DATABASE = 1,
  RUN_QUERY_SUCCESS = 2,
  SUCCESSFUL_BINDING = 3,
  ADD_INPUT_WIDGET = 4,
  // ADD_ONSUBMIT_BINDING = 5,
  DEPLOY = 5,
  FINISH = 6,
}

export type OnboardingHelperConfig = {
  step?: number;
  title: string;
  description?: string;
  skipLabel?: string;
  snippet?: string;
  image?: {
    src: string;
  };
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
        "1. Create a new query on superDB. \n2. A select query can fetch us updates from heroes all across the multiverse.\n3. Run query and check response",
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611815342/Appsmith/Onboarding/standup_query.gif",
      },
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
        "1. Click on add widget button to view widgets panel. \n2. Click on add widget button to view widgets panel.",
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611815393/Appsmith/Onboarding/table_drag.gif",
      },
      action: {
        label: "Show Hint",
        action: showIndicator(OnboardingStep.RUN_QUERY_SUCCESS),
      },
      cheatAction: {
        label: "Super Hack",
        action: {
          type: "ONBOARDING_ADD_TABLE_WIDGET",
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
      step: 3,
      title: "Connect Real Data",
      description:
        "1. Use your javascript superpowers to populate the static TableData with live query results.\n\nUse the snippet below inside TableData",
      snippet: "{{fetch_standup_updates.data}}",
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611815341/Appsmith/Onboarding/binding.gif",
      },
      action: {
        label: "Continue",
      },
      cheatAction: {
        label: "Super Hack",
        action: {
          type: "ONBOARDING_ADD_BINDING",
        },
      },
    },
  },
  [OnboardingStep.ADD_INPUT_WIDGET]: {
    name: "ADD_INPUT_WIDGET",
    setup: () => [
      {
        type: "LISTEN_ADD_INPUT_WIDGET",
      },
    ],
    helper: {
      step: 4,
      title: "Capture Hero Updates and update superdb",
      description:
        "1. Drag an input so that heroes can enter their daily updates\n2. Create a query using OnSubmit action to insert a standup_update.",
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611830618/Appsmith/Onboarding/onsubmit.gif",
      },
      action: {
        label: "Continue",
      },
      cheatAction: {
        label: "Super Hack",
        action: {
          type: "ONBOARDING_ADD_INPUT_WIDGET",
        },
      },
    },
  },
  // [OnboardingStep.ADD_ONSUBMIT_BINDING]: {
  //   name: "ADD_ONSUBMIT_BINDING",
  //   setup: () => [],
  //   helper: {
  //     step: 5,
  //     title: "Update the super DB",
  //     description: "Create a query to insert a standup_updates onSubmit",
  //     image: {
  //       src:
  //         "https://res.cloudinary.com/drako999/image/upload/v1611815729/Appsmith/Onboarding/drag_input.gif",
  //     },
  //     action: {
  //       label: "Continue",
  //     },
  //     cheatAction: {
  //       label: "Super Hack",
  //       action: {
  //         type: "ONBOARDING_ADD_ONSUBMIT_BINDING",
  //       },
  //     },
  //   },
  // },
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
      title: "Deploy the Standup Dashboard to save the world from meetings!",
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
