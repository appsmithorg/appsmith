/* ====================================================
    **** Structural Components ****
    Components that are part of the main structure of the IDE experience
====================================================**/

/**
 * The IDEHeader gets exported with 3 layout subsections.
 * IDEHeader.Left, IDEHeader.Center, IDEHeader.Right
 * These are composable components that you can use to spread the content of the header
 * It is possible to use the IDE Header without using these subsections
 */
export { default as IDEHeader } from "./Structure/Header";

/* ====================================================
    **** UI Components ****
    Components that are smaller UI abstractions for easy use and standardisation within the IDE
=======================================================**/

/**
 * IDEHeaderTitle is a small text styled wrapper that is suitable to be used inside IDEHeader
 */
export { default as IDEHeaderTitle } from "./Components/HeaderTitle";
/**
 * IDEHeaderEditorSwitcher can be used for a trigger component to show a dropdown for pages, modules
 * or any list of elements in the header E.g., Pages / Page 1
 */
export { default as IDEHeaderEditorSwitcher } from "./Components/HeaderEditorSwitcher";
/**
 * The IDEHeaderDropdown gets exported with 2 layout subsections.
 * IDEHeaderDropdown.Header, IDEHeaderDropdown.Body
 * These are composable components that you can use to spread the content of the header
 * It is possible to use the IDE Header without using these subsections
 */
export { default as IDEHeaderDropdown } from "./Components/HeaderDropdown";
/**
 * IDEBottomView is a versatile view meant to be at the bottom of the screen.
 * It is resizable and can be hidden or collapsed based on the behavior configured
 * The view is designed for showing tabs, but this component does not assume this can
 * accept any view to be rendered
 */
export { default as IDEBottomView } from "./Components/BottomView";

/* ====================================================
    **** Interfaces ****
    Common types that are used by the different components of the IDE
=======================================================**/

export { ViewHideBehaviour, ViewDisplayMode } from "./Interfaces/View";
