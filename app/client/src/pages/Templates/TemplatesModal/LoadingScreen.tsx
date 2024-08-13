import React from "react";
import styled from "styled-components";
import { Spinner, Text } from "@appsmith/ads";

const Wrapper = styled.div`
  height: 85vh;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spaces[9]}px;
`;

interface LoadingScreenProps {
  text: string;
}

function LoadingScreen(props: LoadingScreenProps) {
  return (
    <Wrapper>
      <Spinner size="lg" />
      <Text kind="heading-m">{props.text}</Text>
    </Wrapper>
  );
}

export default LoadingScreen;
