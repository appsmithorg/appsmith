import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

export const THEME = EditorTheme.LIGHT;

export enum ActionRunBehaviour {
  AUTOMATIC = "AUTOMATIC",
  PAGE_LOAD = "PAGE_LOAD",
  MANUAL = "MANUAL",
}

export const RUN_BEHAVIOR = {
  AUTOMATIC: {
    label: "Automatic",
    subText: "Query runs on page load or when a variable it depends on changes",
    value: ActionRunBehaviour.AUTOMATIC,
  },
  PAGE_LOAD: {
    label: "On page load",
    subText: "Query runs when the page loads or when manually triggered",
    value: ActionRunBehaviour.PAGE_LOAD,
  },
  MANUAL: {
    label: "Manual",
    subText: "Query only runs when called in an event or JS with .run()",
    value: ActionRunBehaviour.MANUAL,
  },
};

export const RUN_BEHAVIOR_VALUES = Object.values(RUN_BEHAVIOR);
