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

const iconSizeHandler = (props: { size: IconProp }) => {
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

export type IconProp = "small" | "medium" | "large" | undefined;
export type IconName = "delete" | "user" | undefined;

const IconWrapper = styled.div<{ size: IconProp }>`
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

export const Icon = (props: { name: IconName; iconSize: IconProp }) => {
  let returnIcon;
  switch (props.name) {
    case "delete":
      returnIcon = (
        <IconWrapper size={props.iconSize}>
          <DeleteIcon />
        </IconWrapper>
      );
      break;
    default:
      returnIcon = (
        <IconWrapper size={props.iconSize}>
          <UserIcon />
        </IconWrapper>
      );
      break;
  }
  return returnIcon;
};
