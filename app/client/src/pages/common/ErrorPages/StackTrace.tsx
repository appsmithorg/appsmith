import React from "react";
import { useSelector } from "react-redux";
import { Text } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import styled from "styled-components";

const StyledWrapper = styled.div`
  height: 100vh;
  padding: 50px;
`;

function StackTrace() {
  const currentError = useSelector(
    (state: AppState) => state.ui.errors.currentError,
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
