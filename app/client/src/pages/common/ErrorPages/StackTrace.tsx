import React from "react";

import type { AppState } from "ee/reducers";
import { useSelector } from "react-redux";
import styled from "styled-components";

import { Text } from "@appsmith/ads";

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
