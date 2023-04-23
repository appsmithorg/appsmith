import React from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system-old";
import { Spinner } from "design-system";

const Wrapper = styled.div`
  height: 85vh;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spaces[9]}px;
`;

type LoadingScreenProps = {
  text: string;
};

function LoadingScreen(props: LoadingScreenProps) {
  return (
    <Wrapper>
      <Spinner size="lg" />
      <Text type={TextType.DANGER_HEADING}>{props.text}</Text>
    </Wrapper>
  );
}

export default LoadingScreen;
