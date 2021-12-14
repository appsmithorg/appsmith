import * as React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { ThemeProp } from "components/ads/common";
import { ButtonBoxShadow, ButtonBoxShadowTypes } from "components/constants";
import { replayHighlightClass } from "globalStyles/portals";

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
      <StyledButtonGroup className={replayHighlightClass} fill>
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
