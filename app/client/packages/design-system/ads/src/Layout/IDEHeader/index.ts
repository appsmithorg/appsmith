/**
 * The IDEHeader gets exported with 3 layout subsections.
 * IDEHeader.Left, IDEHeader.Center, IDEHeader.Right
 * These are composable components that you can use to spread the content of the header
 * It is possible to use the IDE Header without using these subsections
 */
export { IDEHeader } from "./IDEHeader";
export { IDE_HEADER_HEIGHT, LOGO_WIDTH } from "./IDEHeader.constants";

/**
 * IDEHeaderSwitcher can be used for a trigger component to show a dropdown for pages, modules
 * or any list of elements in the header E.g., Pages / Page 1
 */
export { IDEHeaderSwitcher } from "./HeaderSwitcher";

/**
 * IDEHeaderTitle is a small text styled wrapper that is suitable to be used inside IDEHeader
 */
export { IDEHeaderTitle } from "./IDEHeaderTitle";

/**
 * The IDEHeaderDropdown gets exported with 2 layout subsections.
 * IDEHeaderDropdown.Header, IDEHeaderDropdown.Body
 * These are composable components that you can use to spread the content of the header
 * It is possible to use the IDE Header without using these subsections
 */
export { IDEHeaderDropdown } from "./HeaderDropdown";
