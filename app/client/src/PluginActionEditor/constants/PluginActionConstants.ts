import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

export const THEME = EditorTheme.LIGHT;

export enum ActionRunBehaviour {
  ON_PAGE_LOAD = "ON_PAGE_LOAD",
  MANUAL = "MANUAL",
}

export const RUN_BEHAVIOR = {
  ON_PAGE_LOAD: {
    label: "On page load",
    subText: "Query runs when the page loads or when manually triggered",
    value: ActionRunBehaviour.ON_PAGE_LOAD,
  },
  MANUAL: {
    label: "Manual",
    subText: "Query only runs when called in an event or JS with .run()",
    value: ActionRunBehaviour.MANUAL,
  },
};

export const RUN_BEHAVIOR_VALUES = Object.values(RUN_BEHAVIOR);
