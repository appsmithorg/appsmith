import React from "react";
import styled from "styled-components";
import { ButtonVariant } from "components/constants";
import { RenderMode, RenderModes } from "constants/WidgetConstants";
import { buttonHoverActiveStyles } from "./utils";

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

export type ButtonContainerProps = {
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
};

const ButtonContainer = styled.div<ButtonContainerProps>`
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  height: 100%;

  & > button {
    width: 100%;
    height: 100%;
  }

  position: relative;
  &:after {
    content: "";
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
  }

  &:hover > button,
  &:active > button {
    ${buttonHoverActiveStyles}
  }
`;

type DragContainerProps = ButtonContainerProps & {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  renderMode?: RenderMode;
  showInAllModes?: boolean;
};

export function DragContainer(props: DragContainerProps) {
  if (props.renderMode === RenderModes.CANVAS || props.showInAllModes) {
    return (
      <ButtonContainer
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.disabled}
        loading={props.loading}
        onClick={(event) => {
          if (props.disabled) return;
          if (props.loading) return;
          if (props.onClick) {
            props.onClick(event);
          }
        }}
        style={props.style}
      >
        {props.children}
      </ButtonContainer>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}
