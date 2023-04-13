import React from "react";
import styled from "styled-components";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { Text } from "design-system";

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${(props) => `${props.theme.spaces[3]}px`};
`;

function StatusLoader({ loaderMsg }: { loaderMsg: string }) {
  return (
    <LoaderWrapper>
      <SpinnerLoader size="lg" />
      <Text kind={"body-m"} style={{ marginLeft: 8 }}>
        {loaderMsg}
      </Text>
    </LoaderWrapper>
  );
}

export default StatusLoader;
