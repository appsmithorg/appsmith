import React from "react";
// import React, { JSXElementConstructor } from "react";
// import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import styled from "styled-components";
import { Size } from "./Button";

const iconSizeHandler = (props: IconProps) => {
  let iconSize: number;
  switch (props.size) {
    case "small":
      iconSize = 12;
      break;
    case "medium":
      iconSize = 14;
      break;
    default:
      iconSize = 15;
      break;
  }
  return iconSize;
};

export type IconName = "delete" | "user" | undefined;

const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  display: inline-block;
  width: ${props => iconSizeHandler(props)}px;
  height: ${props => iconSizeHandler(props)}px;
  svg {
    width: ${props => iconSizeHandler(props)}px;
    height: ${props => iconSizeHandler(props)}px;
  }
`;

export type IconProps = {
  size?: Size;
  name?: IconName;
};

export const Icon = (props: IconProps) => {
  let returnIcon;
  switch (props.name) {
    case "delete":
      returnIcon = (
        <IconWrapper size={props.size}>
          <DeleteIcon />
        </IconWrapper>
      );
      break;
    default:
      returnIcon = (
        <IconWrapper size={props.size}>
          <UserIcon />
        </IconWrapper>
      );
      break;
  }
  return returnIcon;
};
