import clsx from "clsx";
import React from "react";

import { Spinner } from "../Spinner";
import { StyledIcon } from "./index.styled";

export type InputIconProps = {
  isLoading?: boolean;
  position: "leading" | "trailing";
};

const InputIcon: React.FC<InputIconProps> = (props) => {
  const { children, isLoading, position } = props;

  if (
    (!children && !isLoading) ||
    (position === "leading" && !children && !isLoading)
  ) {
    return null;
  }

  if (!isLoading) {
    return <StyledIcon position={position}>{children}</StyledIcon>;
  }

  return (
    <StyledIcon position={position}>
      <Spinner />
    </StyledIcon>
  );
};

export default InputIcon;
