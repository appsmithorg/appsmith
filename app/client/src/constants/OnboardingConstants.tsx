import { setCurrentStep } from "actions/onboardingActions";
import { ReduxAction, ReduxActionTypes } from "./ReduxActionConstants";
import { EventName } from "../utils/AnalyticsUtil";

export enum OnboardingStep {
  NONE = -1,
  WELCOME = 0,
  EXAMPLE_DATABASE = 1,
  RUN_QUERY = 2,
  RUN_QUERY_SUCCESS = 3,
  ADD_WIDGET = 4,
  SUCCESSFUL_BINDING = 5,
  DEPLOY = 6,
}

export type OnboardingTooltip = {
  title: string;
  description?: string;
  action?: {
    label: string;
    action?: ReduxAction<OnboardingStep>;
  };
  snippet?: string;
  isFinalStep?: boolean;
};

export type OnboardingStepConfig = {
  setup: () => { type: string; payload?: any }[];
  tooltip: OnboardingTooltip;
  eventName?: EventName;
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
    eventName: "ONBOARDING_WELCOME",
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
    eventName: "ONBOARDING_EXAMPLE_DATABASE",
  },
  [OnboardingStep.RUN_QUERY]: {
    setup: () => {
      return [];
    },
    tooltip: {
      title:
        "This is where you query data. Here’s one that fetches a list of users stored in the DB.",
    },
    eventName: "ONBOARDING_RUN_QUERY",
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
    eventName: "ONBOARDING_RUN_QUERY",
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
    eventName: "ONBOARDING_ADD_WIDGET",
  },
  [OnboardingStep.SUCCESSFUL_BINDING]: {
    setup: () => {
      return [
        {
          type: ReduxActionTypes.LISTEN_FOR_WIDGET_UNSELECTION,
        },
      ];
    },
    tooltip: {
      title: "Your widget is now talking to your data 👌👏",
      description:
        "You can access widgets and actions as JS variables anywhere inside {{ }}",
    },
    eventName: "ONBOARDING_SUCCESSFUL_BINDING",
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
    eventName: "ONBOARDING_DEPLOY",
  },
};
