import { Flex } from "@appsmith/ads";
import React from "react";
import type { ReactNode } from "react";
import styled from "styled-components";

interface SidePaneContainerProps {
  children?: ReactNode;
  padded?: boolean;
}

const StyledContainer = styled(Flex)<Pick<SidePaneContainerProps, "padded">>`
  padding: ${({ padded }) => padded && "var(--ads-v2-spaces-2)"};
`;

function SidePaneWrapper({ children, padded = false }: SidePaneContainerProps) {
  return (
    <StyledContainer
      flexDirection="column"
      height="100%"
      padded={padded}
      width={"100%"}
    >
      {children}
    </StyledContainer>
  );
}

export default SidePaneWrapper;
