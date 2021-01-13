import { ReduxAction, ReduxActionTypes } from "./ReduxActionConstants";
import { EventName } from "../utils/AnalyticsUtil";
import { showTooltip } from "actions/onboardingActions";

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

export type OnboardingTooltip = {
  title: string;
  description?: string;
  action?: {
    label: string;
    action?: ReduxAction<OnboardingStep>;
  };
  onClickOutside?: ReduxAction<any>;
  snippet?: string;
  isFinalStep?: boolean;
};

export type OnboardingStepConfig = {
  setup: () => { type: string; payload?: any }[];
  tooltip: OnboardingTooltip;
};

export const OnboardingConfig: Record<OnboardingStep, OnboardingStepConfig> = {
  [OnboardingStep.NONE]: {
    setup: () => {
      return [];
    },
    tooltip: {
      title: "",
      description: "",
    },
  },
  [OnboardingStep.WELCOME]: {
    setup: () => {
      // To setup the state if any
      // Return action that needs to be dispatched
      return [
        {
          type: ReduxActionTypes.SHOW_WELCOME,
        },
      ];
    },
    tooltip: {
      title: "",
      description: "",
    },
  },
  [OnboardingStep.EXAMPLE_DATABASE]: {
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
    tooltip: {
      title:
        "We’ve connected to an example Postgres database. You can now query it.",
    },
  },
  [OnboardingStep.RUN_QUERY]: {
    setup: () => {
      return [];
    },
    tooltip: {
      title:
        "This is where you query data. Here’s one that fetches a list of users stored in the DB.",
    },
  },
  [OnboardingStep.RUN_QUERY_SUCCESS]: {
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
    tooltip: {
      title:
        "This is the response from your query. Now let’s connect it to a UI widget.",
    },
  },
  [OnboardingStep.ADD_WIDGET]: {
    setup: () => {
      return [];
    },
    tooltip: {
      title:
        "Your first widget 🎉 Copy the snippet below and paste it inside TableData to see the magic",
      snippet: "{{ExampleQuery.data}}",
    },
  },
  [OnboardingStep.SUCCESSFUL_BINDING]: {
    setup: () => {
      return [];
    },
    tooltip: {
      title: "Your widget is now talking to your data 👌👏",
      description:
        "You can access widgets and actions as JS variables anywhere inside {{ }}",
      onClickOutside: showTooltip(OnboardingStep.DEPLOY),
    },
  },
  [OnboardingStep.DEPLOY]: {
    setup: () => {
      return [
        {
          type: ReduxActionTypes.LISTEN_FOR_DEPLOY,
        },
      ];
    },
    tooltip: {
      title: "You’re almost done! Just Hit Deploy",
      isFinalStep: true,
    },
  },
  // Final step
  [OnboardingStep.FINISH]: {
    setup: () => {
      return [];
    },
    tooltip: {
      title: "",
    },
  },
};
