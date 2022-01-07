import styled from "styled-components";
import React from "react";
import { Colors } from "constants/Colors";

type NestedFormWrapperProps = React.PropsWithChildren<{
  backgroundColor?: string;
  className?: string;
}>;

type StyledWrapperProps = {
  backgroundColor?: string;
};

const WRAPPER_PADDING = 10;

const StyledWrapper = styled.div<StyledWrapperProps>`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || Colors.GREY_1};
  padding: ${WRAPPER_PADDING}px;
`;

function NestedFormWrapper({
  backgroundColor,
  children,
  className,
}: NestedFormWrapperProps) {
  return (
    <StyledWrapper backgroundColor={backgroundColor} className={className}>
      {children}
    </StyledWrapper>
  );
}

export default NestedFormWrapper;
