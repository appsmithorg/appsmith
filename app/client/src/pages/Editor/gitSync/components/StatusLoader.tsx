import React from "react";
import styled from "styled-components";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { Text } from "@appsmith/ads";

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: ${(props) => `${props.theme.spaces[3]}px`};
`;

function StatusLoader({ loaderMsg }: { loaderMsg: string }) {
  return (
    <LoaderWrapper data-testid="t--git-merge-loader">
      <SpinnerLoader size="md" />
      <Text kind={"body-m"} style={{ marginLeft: 8 }}>
        {loaderMsg}
      </Text>
    </LoaderWrapper>
  );
}

export default StatusLoader;
