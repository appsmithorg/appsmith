import React from "react";
import styled, { css } from "styled-components";
import type { RenderMode } from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";
import { buttonHoverActiveStyles } from "./utils";
import type { ButtonContainerProps } from "./types";

const ButtonContainer = styled.div<ButtonContainerProps>`
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  height: 100%;

  & > button {
    width: 100%;
    height: 100%;
  }

  ${({ maxWidth, minHeight, minWidth, shouldFitContent }) =>
    shouldFitContent &&
    css`
      .bp3-button.bp3-fill {
        display: flex;
        width: auto;
        ${minWidth ? `min-width: ${minWidth}px;` : ""}
        ${minHeight ? `min-height: ${minHeight}px;` : ""}
        ${maxWidth ? `max-width: ${maxWidth}px;` : ""}
      }
    `}

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
    const hasOnClick = Boolean(
      props.onClick && !props.disabled && !props.loading,
    );
    return (
      <ButtonContainer
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.disabled}
        loading={props.loading}
        maxWidth={props.maxWidth}
        minHeight={props.minHeight}
        minWidth={props.minWidth}
        onClick={hasOnClick ? props.onClick : undefined}
        shouldFitContent={props.shouldFitContent}
        style={props.style}
      >
        {props.children}
      </ButtonContainer>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}
