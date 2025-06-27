import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";

export const RUN_BEHAVIOR_CONFIG_PROPERTY = "runBehaviour";

export const RUN_BEHAVIOR_VALUES = [
  {
    label: "Automatic",
    subText: "Query runs on page load or when a variable it depends on changes",
    value: ActionRunBehaviour.AUTOMATIC,
    children: "Automatic",
  },
  {
    label: "On page load",
    subText: "Query runs when the page loads or when manually triggered",
    value: ActionRunBehaviour.ON_PAGE_LOAD,
    children: "On page load",
  },
  {
    label: "Manual",
    subText: "Query only runs when called in an event or JS with .run()",
    value: ActionRunBehaviour.MANUAL,
    children: "Manual",
  },
];

export const JS_OBJECT_RUN_BEHAVIOR_VALUES = [
  {
    label: "Automatic",
    subText:
      "JS function runs on page load or when a variable it depends on changes",
    value: ActionRunBehaviour.AUTOMATIC,
    children: "Automatic",
  },
  {
    label: "On page load",
    subText: "JS function runs when the page loads or when manually triggered",
    value: ActionRunBehaviour.ON_PAGE_LOAD,
    children: "On page load",
  },
  {
    label: "Manual",
    subText:
      "JS function only runs when called in an event or JS with functionName()",
    value: ActionRunBehaviour.MANUAL,
    children: "Manual",
  },
  {
    label: "On page unload",
    subText: "Query runs when the page unloads or when manually triggered",
    value: ActionRunBehaviour.ON_PAGE_UNLOAD,
    children: "On page unload",
  },
];
