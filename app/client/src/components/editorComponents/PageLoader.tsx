import React from "react";
import { Text, ProgressBar } from "@blueprintjs/core";
import styled from "styled-components";

const PageLoaderWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  left: 0;
  top: 0;
  background: white;
  & > div {
    width: 100px;
    height: 100px;
    text-align: center;
  }
`;

type PageLoaderProps = {
  value?: number;
};

export function PageLoader(props: PageLoaderProps) {
  return (
    <PageLoaderWrapper>
      <div>
        <ProgressBar value={props.value ? props.value / 100 : undefined} />
        <Text>Loading</Text>
      </div>
    </PageLoaderWrapper>
  );
}

export default PageLoader;
