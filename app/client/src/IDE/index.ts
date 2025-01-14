/* ====================================================
    **** Structural Components ****
    Components that are part of the main structure of the IDE experience
====================================================**/

/**
 * The IDEToolbar gets exported with 2 layout subsections.
 * IDEToolbar.Left and IDEToolbar.Right
 * These are composable components that you can use to spread the content of the toolbar
 * It is possible to use the Toolbar without using these subsections
 */
export { default as IDEToolbar } from "./Structure/Toolbar";

/* ====================================================
    **** UI Components ****
    Components that are smaller UI abstractions for easy use and standardisation within the IDE
=======================================================**/

/**
 * IDEBottomView is a versatile view meant to be at the bottom of the screen.
 * It is resizable and can be hidden or collapsed based on the behavior configured
 * The view is designed for showing tabs, but this component does not assume this can
 * accept any view to be rendered
 */
export { default as IDEBottomView } from "./Components/BottomView";

/**
 * IDESidePaneWrapper is used as a wrapper for side panes, which provides a border and optional padding
 * and enforces 100% width and height to the parent.
 */
export { default as IDESidePaneWrapper } from "./Components/SidePaneWrapper";

/**
 * ToolbarSettingsPopover is a popover attached to a settings toggle button in the toolbar
 */
export { ToolbarSettingsPopover } from "./Components/ToolbarSettingsPopover";

/**
 * EditableName is a component that allows the user to edit the name of an entity
 * It is used in the IDE for renaming pages, actions, queries, etc.
 */
export {
  EditableName,
  RenameMenuItem,
  useIsRenaming,
  useValidateEntityName,
} from "./Components/EditableName";

/* ====================================================
    **** Interfaces ****
    Common types that are used by the different components of the IDE
=======================================================**/

export { ViewHideBehaviour, ViewDisplayMode } from "./Interfaces/View";
