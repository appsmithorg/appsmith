import { ReduxActionTypes } from "./ReduxActionConstants";
import HandwaveGif from "assets/gifs/handwave.gif";
import DeployGif from "assets/gifs/deploy_orange.gif";
import InputDragGif from "assets/gifs/input_drag.gif";
import SuperHeroGif from "assets/gifs/super_hero.gif";
import { Dispatch } from "redux";
import { setOnboardingWelcomeState } from "utils/storage";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { showOnboardingLoader } from "actions/onboardingActions";

export enum OnboardingStep {
  NONE = -1,
  WELCOME = 0,
  EXAMPLE_DATABASE = 1,
  RUN_QUERY_SUCCESS = 2,
  SUCCESSFUL_BINDING = 3,
  ADD_INPUT_WIDGET = 4,
  DEPLOY = 5,
  FINISH = 6,
}

export type OnboardingHelperConfig = {
  step?: number;
  title: string;
  description?: string;
  subSteps?: { description: string }[];
  skipLabel?: string;
  hint?: {
    description: string;
    snippet: string;
  };
  image?: {
    src: string;
  };
  action?: {
    label: string;
    // action to be dispatched
    action?: (dispatch?: Dispatch<any>) => void;
    initialStep?: boolean;
  };
  secondaryAction?: {
    label: string;
    action?: { type: string; payload?: any };
  };
  cheatAction?: {
    label: string;
    action: { type: string; payload?: any };
  };
  allowMinimize: boolean;
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
      return [showOnboardingLoader(true)];
    },
    helper: {
      title: "👋 Welcome to Appsmith!",
      description:
        "We'd like to show you around! Let's build an app for remote teams to do async meeting updates.",
      skipLabel: "No thanks",
      image: {
        src: HandwaveGif,
      },
      action: {
        label: "Let’s go",
        action: (dispatch) => {
          if (dispatch) {
            dispatch({
              type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
            });
          }
          setOnboardingWelcomeState(false);
        },
        initialStep: true,
      },
      allowMinimize: false,
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
      subSteps: [
        {
          description:
            "Create a new query that can fetch standup updates from across the multiverse",
        },
        {
          description: "Hit Run to check it's response",
        },
      ],
      image: {
        src:
          "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/new-query.gif",
      },
      skipLabel: "Skip tour",
      cheatAction: {
        label: "Do it for me",
        action: {
          type: ReduxActionTypes.ONBOARDING_CREATE_QUERY,
        },
      },
      allowMinimize: false,
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
      subSteps: [
        {
          description: "Click the add widget button to open the widgets panel",
        },
        {
          description:
            "Drag a table so that heroes can view each other's updates.",
        },
      ],
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611839705/Appsmith/Onboarding/addwidget.gif",
      },
      skipLabel: "Skip tour",
      cheatAction: {
        label: "Do it for me",
        action: {
          type: ReduxActionTypes.ONBOARDING_ADD_TABLE_WIDGET,
        },
      },
      allowMinimize: false,
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
      subSteps: [
        {
          description:
            "Use your javascript superpowers to populate the static TableData with live query results.",
        },
      ],
      hint: {
        description: "Use the snippet below inside TableData",
        snippet: "{{fetch_standup_updates.data}}",
      },
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611906837/Appsmith/Onboarding/property_pane.gif",
      },
      skipLabel: "Skip tour",
      action: {
        label: "Show me how",
        action: () => {
          AnalyticsUtil.logEvent("ONBOARDING_BINDING_HINT");
        },
      },
      cheatAction: {
        label: "Do it for me",
        action: {
          type: ReduxActionTypes.ONBOARDING_ADD_TABLEDATA_BINDING,
        },
      },
      allowMinimize: false,
    },
  },
  [OnboardingStep.ADD_INPUT_WIDGET]: {
    name: "ADD_INPUT_WIDGET",
    setup: () => [
      {
        type: ReduxActionTypes.LISTEN_ADD_INPUT_WIDGET,
      },
    ],
    helper: {
      step: 4,
      title: "Capture Hero Updates",
      subSteps: [
        {
          description:
            "Drag an input so that heroes can enter their daily updates.",
        },
        {
          description:
            "Create a query in the OnSubmit action to insert a standup_update.",
        },
      ],
      image: {
        src: InputDragGif,
      },
      skipLabel: "Skip tour",
      cheatAction: {
        label: "Do it for me",
        action: {
          type: ReduxActionTypes.ONBOARDING_ADD_INPUT_WIDGET,
        },
      },
      allowMinimize: false,
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
      title: "Deploy the Standup Dashboard to save the world from meetings!",
      image: {
        src: DeployGif,
      },
      skipLabel: "Skip tour",
      cheatAction: {
        label: "Do it for me",
        action: {
          type: ReduxActionTypes.ONBOARDING_DEPLOY,
        },
      },
      allowMinimize: false,
    },
  },
  // Final step
  [OnboardingStep.FINISH]: {
    name: "FINISH",
    setup: () => {
      return [];
    },
    helper: {
      title:
        "Great Job! You built an app that saves your team from boring meetings",
      description: "WHAT YOU’VE LEARNT",
      subSteps: [
        {
          description: "Query a database directly",
        },
        {
          description: "Build a dashboard without HTML/CSS",
        },
        {
          description: "Read/Write data to the UI using JS",
        },
        {
          description: "Deploy an app with a Click",
        },
      ],
      image: {
        src: SuperHeroGif,
      },
      secondaryAction: {
        label: "Back Home",
        action: {
          type: ReduxActionTypes.ONBOARDING_RETURN_HOME,
        },
      },
      action: {
        label: "Next Mission",
        action: () => {
          window.open(
            "https://docs.appsmith.com/v/v1.2.1/tutorial-1",
            "_blank",
          );
          AnalyticsUtil.logEvent("ONBOARDING_NEXT_MISSION");
        },
      },
      allowMinimize: true,
    },
  },
};
