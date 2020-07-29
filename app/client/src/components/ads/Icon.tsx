import React from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import styled from "styled-components";
import { Size } from "./Button";
import { sizeHandler } from "./NewSpinner";

export type IconName = "delete" | "user" | undefined;

const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  display: inline-block;
  width: ${props => sizeHandler(props)}px;
  height: ${props => sizeHandler(props)}px;
  svg {
    width: ${props => sizeHandler(props)}px;
    height: ${props => sizeHandler(props)}px;
  }
  visibility: ${props => (props.invisible ? "hidden" : "visible")};
`;

export type IconProps = {
  size?: Size;
  name?: IconName;
  invisible?: boolean;
};

export const Icon = (props: IconProps) => {
  let returnIcon;
  switch (props.name) {
    case "delete":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <DeleteIcon />
        </IconWrapper>
      );
      break;
    default:
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <UserIcon />
        </IconWrapper>
      );
      break;
  }
  return returnIcon;
};
