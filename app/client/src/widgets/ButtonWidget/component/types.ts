/*
  We have this Bug in Firefox where we are unable to drag
  buttons - https://bugzilla.mozilla.org/show_bug.cgi?id=568313

  We found a solution here - https://stackoverflow.com/a/43888410
*/

import type { ButtonVariant } from "components/constants";

/*
  We are adding a wrapper in Canvas mode to the Button and once
  we deploy it we remove the wrapper altogether.
  Because we are adding a wrapper we also need to duplicate any
  :hover, :active & :focus styles and pass onClick to the wrapper.
  We could have checked for firefox browser using window.navigator
  but we wanted our widget to be pure and have similar experience
  in all the Browsers.
*/

/*
  For the Button Widget we don't remove the DragContainer
  because of the Tooltip issue -
  https://github.com/appsmithorg/appsmith/pull/12372
  For this reason we pass the showInAllModes prop.
*/

export interface ButtonContainerProps {
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  disabled?: boolean;
  shouldFitContent?: boolean;
  maxWidth?: number;
  minWidth?: number;
  minHeight?: number;
  loading?: boolean;
  style?: React.CSSProperties;
}
