import React from "react";
// import React, { JSXElementConstructor } from "react";
// import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import styled from "styled-components";

// import { Color } from "./Colors";

/* eslint-disable react/display-name */

// export const Icons: {
//   [id: string]: JSXElementConstructor<IconProps>;
// } = {
//   delete: (props: IconProps) => (
//     <IconWrapper {...props}>
//       <DeleteIcon />
//     </IconWrapper>
//   ),
//   user: (props: IconProps) => (
//     <IconWrapper {...props}>
//       <UserIcon />
//     </IconWrapper>
//   ),
// };

// export type IconName = keyof typeof Icons

const iconSizeHandler = (props: { size: IconSize }) => {
  let iconSize: number;
  switch (props.size) {
    case "small":
      iconSize = 12;
      break;
    case "medium":
      iconSize = 14;
      break;
    case "large":
      iconSize = 15;
      break;
    default:
      iconSize = 20;
      break;
  }
  return iconSize;
};

const IconWrapper = styled.span<{ size: IconSize }>`
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

export type IconSize = "small" | "medium" | "large" | "tab" | undefined;
export type IconName = "delete" | "user" | undefined;

type IconProps = {
  name: IconName;
  size: IconSize;
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
