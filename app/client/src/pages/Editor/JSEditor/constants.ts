export const CONFIRM_BEFORE_CALLING_HEADING = {
  text: "Confirm before calling ",
  hasInfo: true,
  info: `Ask for confirmation before executing function.`,
  key: "run_before_calling",
  hidden: true,
};

export const SETTINGS_HEADINGS = [
  {
    text: "Function name",
    hasInfo: false,
    key: "func_name",
    hidden: undefined,
  },
  {
    text: "Run on page load",
    hasInfo: true,
    info: "Allow function run when page loads",
    key: "run_on_pageload",
    hidden: undefined,
  },
  CONFIRM_BEFORE_CALLING_HEADING,
];

export const RUN_GUTTER_ID = "run-gutter";
export const RUN_GUTTER_CLASSNAME = "run-marker-gutter";
export const JS_OBJECT_HOTKEYS_CLASSNAME = "js-object-hotkeys";
export const ANIMATE_RUN_GUTTER = "animate-run-marker";
