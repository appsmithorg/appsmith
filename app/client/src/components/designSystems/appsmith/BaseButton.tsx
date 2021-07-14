import React from "react";
import { IButtonProps, Button } from "@blueprintjs/core";
import { darkenActive, darkenHover, Theme } from "constants/DefaultTheme";
import styled, { css } from "styled-components";
import { omit } from "lodash";
export type ButtonStyleName = "primary" | "secondary" | "error";

type ButtonStyleProps = {
  accent?: ButtonStyleName;
  filled?: boolean;
};

const AccentColorMap: Record<ButtonStyleName, string> = {
  primary: "primaryOld",
  secondary: "secondaryOld",
  error: "error",
};

const getButtonColorStyles = (props: { theme: Theme } & ButtonStyleProps) => {
  if (props.filled) return props.theme.colors.textOnDarkBG;
  if (props.accent) {
    if (props.accent === "secondary") {
      return props.theme.colors[AccentColorMap["primary"]];
    }
    return props.theme.colors[AccentColorMap[props.accent]];
  }
};

const ButtonColorStyles = css<ButtonStyleProps>`
  color: ${getButtonColorStyles};
  svg {
    fill: ${getButtonColorStyles};
  }
`;

const ButtonWrapper = styled((props: ButtonStyleProps & IButtonProps) => (
  <Button {...omit(props, ["accent", "filled"])} />
))<ButtonStyleProps>`
  &&&& {
    ${ButtonColorStyles};
    width: 100%;
    height: 100%;
    transition: background-color 0.2s;
    background-color: ${(props) =>
      props.filled &&
      props.accent &&
      props.theme.colors[AccentColorMap[props.accent]]};
    border: 1px solid
      ${(props) =>
        props.accent
          ? props.theme.colors[AccentColorMap[props.accent]]
          : props.theme.colors.primary};
    border-radius: 0;
    font-weight: ${(props) => props.theme.fontWeights[2]};
    outline: none;
    &.bp3-button {
      padding: 0px 10px;
    }
    && .bp3-button-text {
      max-width: 99%;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      max-height: 100%;
      overflow: hidden;
    }
    &&:hover,
    &&:focus {
      ${ButtonColorStyles};
      background-color: ${(props) => {
        if (!props.filled) return props.theme.colors.secondaryDarker;
        if (props.accent !== "secondary" && props.accent) {
          return darkenHover(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
      border-color: ${(props) => {
        if (!props.filled) return;
        if (props.accent !== "secondary" && props.accent) {
          return darkenHover(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
    }
    &&:active {
      ${ButtonColorStyles};
      background-color: ${(props) => {
        if (!props.filled) return props.theme.colors.secondaryDarkest;
        if (props.accent !== "secondary" && props.accent) {
          return darkenActive(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
      border-color: ${(props) => {
        if (!props.filled) return;
        if (props.accent !== "secondary" && props.accent) {
          return darkenActive(props.theme.colors[AccentColorMap[props.accent]]);
        }
      }};
    }
    &&.bp3-disabled {
      background-color: #d0d7dd;
      border: none;
    }
  }
`;

// To be used in any other part of the app
export function BaseButton(props: IButtonProps & ButtonStyleProps) {
  return <ButtonWrapper {...props} />;
}
