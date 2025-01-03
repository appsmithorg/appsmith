import React from "react";
import styled from "styled-components";
import { Spinner, Text } from "@appsmith/ads";

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const LoaderText = styled(Text)`
  margin-left: 8px;
`;

function StatusLoader({ loaderMsg }: { loaderMsg: string }) {
  return (
    <LoaderWrapper data-testid="t--git-merge-loader">
      <Spinner size="md" />
      <LoaderText kind="body-m">{loaderMsg}</LoaderText>
    </LoaderWrapper>
  );
}

export default StatusLoader;
