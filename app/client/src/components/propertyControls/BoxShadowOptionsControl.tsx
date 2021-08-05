import * as React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { ThemeProp } from "components/ads/common";

export enum ButtonBoxShadowTypes {
  NONE = "NONE",
  VARIANT1 = "VARIANT1",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
  VARIANT4 = "VARIANT4",
  VARIANT5 = "VARIANT5",
}

export type ButtonBoxShadow = keyof typeof ButtonBoxShadowTypes;

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
        <StyledButton
          active={
            propertyValue === ButtonBoxShadowTypes.NONE ||
            propertyValue === undefined
          }
          icon={
            <ControlIcons.BOX_SHADOW_NONE
              color="#CACACA"
              keepColors
              width={16}
            />
          }
          large
          onClick={() => this.toggleOption(ButtonBoxShadowTypes.NONE)}
        />
        <StyledButton
          active={propertyValue === ButtonBoxShadowTypes.VARIANT1}
          icon={
            <ControlIcons.BOX_SHADOW_VARIANT1
              height={32}
              keepColors
              width={40}
            />
          }
          large
          onClick={() => this.toggleOption(ButtonBoxShadowTypes.VARIANT1)}
        />
        <StyledButton
          active={propertyValue === ButtonBoxShadowTypes.VARIANT2}
          icon={
            <ControlIcons.BOX_SHADOW_VARIANT2
              height={28}
              keepColors
              width={36}
            />
          }
          large
          onClick={() => this.toggleOption(ButtonBoxShadowTypes.VARIANT2)}
        />
        <StyledButton
          active={propertyValue === ButtonBoxShadowTypes.VARIANT3}
          icon={
            <ControlIcons.BOX_SHADOW_VARIANT3
              height={27}
              keepColors
              width={32}
            />
          }
          large
          onClick={() => this.toggleOption(ButtonBoxShadowTypes.VARIANT3)}
        />
        <StyledButton
          active={propertyValue === ButtonBoxShadowTypes.VARIANT4}
          icon={
            <ControlIcons.BOX_SHADOW_VARIANT4
              height={26}
              keepColors
              width={34}
            />
          }
          large
          onClick={() => this.toggleOption(ButtonBoxShadowTypes.VARIANT4)}
        />
        <StyledButton
          active={propertyValue === ButtonBoxShadowTypes.VARIANT5}
          icon={
            <ControlIcons.BOX_SHADOW_VARIANT5
              height={26}
              keepColors
              width={34}
            />
          }
          large
          onClick={() => this.toggleOption(ButtonBoxShadowTypes.VARIANT5)}
        />
      </StyledButtonGroup>
    );
  }

  private toggleOption = (option: ButtonBoxShadow) => {
    this.updateProperty(this.props.propertyName, option);
  };
}

export default BoxShadowOptionsControl;
