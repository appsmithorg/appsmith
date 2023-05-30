import React from "react";
import styled from "styled-components";
import { RenderModes } from "constants/WidgetConstants";
import type { RenderMode } from "constants/WidgetConstants";

/*
  We have this Bug in Firefox where we are unable to drag
  buttons - https://bugzilla.mozilla.org/show_bug.cgi?id=568313

  We found a solution here - https://stackoverflow.com/a/43888410
*/

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

const ButtonContainer = styled.div`
  height: 100%;
  position: relative;

  .auto-layout & > [data-button] {
    display: flex;
    width: auto;
    max-width: 352px;
    min-width: 112px;
    min-height: 32px;
  }
`;

type DragContainerProps = {
  children?: React.ReactNode;
  renderMode?: RenderMode;
  showInAllModes?: boolean;
};

export function DragContainer(props: DragContainerProps) {
  if (props.renderMode === RenderModes.CANVAS || props.showInAllModes) {
    return <ButtonContainer>{props.children}</ButtonContainer>;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}
