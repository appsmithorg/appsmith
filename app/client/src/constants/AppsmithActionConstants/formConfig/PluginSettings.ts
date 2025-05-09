import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";

export const RUN_BEHAVIOR_CONFIG_PROPERTY = "runBehaviour";

export const RUN_BEHAVIOR = {
  ON_PAGE_LOAD: {
    label: "On page load",
    subText: "Query runs when the page loads or when manually triggered",
    value: ActionRunBehaviour.ON_PAGE_LOAD,
    children: "On page load",
  },
  MANUAL: {
    label: "Manual",
    subText: "Query only runs when called in an event or JS with .run()",
    value: ActionRunBehaviour.MANUAL,
    children: "Manual",
  },
};

export const AUTOMATIC_RUN_BEHAVIOR = {
  label: "Automatic",
  subText: "Query runs on page load or when a variable it depends on changes",
  value: ActionRunBehaviour.AUTOMATIC,
  children: "Automatic",
};

export const RUN_BEHAVIOR_VALUES = Object.values(RUN_BEHAVIOR);
