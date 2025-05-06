import React from "react";
import { useSelector } from "react-redux";
import { Text } from "@appsmith/ads";
import type { DefaultRootState } from "react-redux";
import styled from "styled-components";

const StyledWrapper = styled.div`
  height: 100vh;
  padding: 50px;
`;

function StackTrace() {
  const currentError = useSelector(
    (state: DefaultRootState) => state.ui.errors.currentError,
  );

  return (
    <StyledWrapper className="flex-col flex items-center justify-center">
      <Text color="red" kind="heading-l">
        SOURCE ACTION: {currentError.sourceAction}
      </Text>
      <Text color="red" kind="heading-m">
        {currentError.stackTrace}
      </Text>
    </StyledWrapper>
  );
}

export default StackTrace;
