import * as React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { ThemeProp } from "components/ads/common";
<<<<<<< HEAD
import { ButtonBoxShadow, ButtonBoxShadowTypes } from "components/constants";
=======

export enum ButtonBoxShadowTypes {
  NONE = "NONE",
  VARIANT1 = "VARIANT1",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
  VARIANT4 = "VARIANT4",
  VARIANT5 = "VARIANT5",
}

export type ButtonBoxShadow = keyof typeof ButtonBoxShadowTypes;
>>>>>>> b170a014c6e24a736b42bdeefd98f0e926c990cf

const StyledButtonGroup = styled(ButtonGroup)`
  display: grid !important;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  height: 100%;
`;

const StyledButton = styled(Button)<ThemeProp & IButtonProps>`
  margin-right: 0 !important;
  border: ${(props) =>
    props.active ? `1px solid #6A86CE` : `1px solid #E0DEDE`};
  border-radius: 0;
  box-shadow: none !important;
  background-image: none;
  background-color: #ffffff !important;
  & > div {
    display: flex;
  }
  &.bp3-active {
    box-shadow: none !important;
    background-color: #ffffff !important;
  }
  &:hover {
    background-color: #ffffff !important;
  }
`;

export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: ButtonBoxShadow | undefined;
}

const buttonConfigs = [
  {
    variant: ButtonBoxShadowTypes.NONE,
    icon: {
      element: ControlIcons.BOX_SHADOW_NONE,
      color: "#CACACA",
      width: 16,
    },
  },
  {
    variant: ButtonBoxShadowTypes.VARIANT1,
    icon: {
      element: ControlIcons.BOX_SHADOW_VARIANT1,
      height: 32,
      width: 40,
    },
  },
  {
    variant: ButtonBoxShadowTypes.VARIANT2,
    icon: {
      element: ControlIcons.BOX_SHADOW_VARIANT2,
      height: 28,
      width: 36,
    },
  },
  {
    variant: ButtonBoxShadowTypes.VARIANT3,
    icon: {
      element: ControlIcons.BOX_SHADOW_VARIANT3,
      height: 27,
      width: 32,
    },
  },
  {
    variant: ButtonBoxShadowTypes.VARIANT4,
    icon: {
      element: ControlIcons.BOX_SHADOW_VARIANT4,
      height: 26,
      width: 34,
    },
  },
  {
    variant: ButtonBoxShadowTypes.VARIANT5,
    icon: {
      element: ControlIcons.BOX_SHADOW_VARIANT5,
      height: 26,
      width: 34,
    },
  },
];

class BoxShadowOptionsControl extends BaseControl<
  BoxShadowOptionsControlProps
> {
  constructor(props: BoxShadowOptionsControlProps) {
    super(props);
  }

  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <StyledButtonGroup fill>
        {buttonConfigs.map(({ icon, variant }) => {
          const active =
            variant === ButtonBoxShadowTypes.NONE
              ? propertyValue === variant || propertyValue === undefined
              : propertyValue === variant;

          return (
            <StyledButton
              active={active}
              icon={
                <icon.element
                  color={icon.color}
                  height={icon.height}
                  keepColors
                  width={icon.width}
                />
              }
              key={variant}
              large
              onClick={() => this.toggleOption(variant)}
            />
          );
        })}
      </StyledButtonGroup>
    );
  }

  private toggleOption = (option: ButtonBoxShadow) => {
    this.updateProperty(this.props.propertyName, option);
  };
}

export default BoxShadowOptionsControl;
