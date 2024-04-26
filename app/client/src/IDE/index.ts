/**
 **** Structural Components ****
 * Components that are part of the main structure of the IDE experience
 **/

/**
 * The IDEHeader gets exported with 3 layout subsections.
 * IDEHeader.Left, IDEHeader.Center, IDEHeader.Right
 * These are composable components that you can use to spread the content of the header
 * It is possible to use the IDE Header without using these subsections
 */
export { default as IDEHeader } from "./Structure/Header";

/**
 **** UI Components ****
 * Components that are smaller UI abstractions for easy use and standardisation within the IDE
 **/

/**
 * IDEHeaderTitle is a small text styled wrapper that is suitable to be used inside IDEHeader
 */
export { default as IDEHeaderTitle } from "./Components/HeaderTitle";

/**
 **** Interfaces ****
 * Common types that are used by the different components of the IDE
 **/
