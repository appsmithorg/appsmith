import React from "react";
import { Text } from "design-system";
import styled from "styled-components";

const Wrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  background-color: var(--ads-v2-color-gray-50);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

function CanvasCodePlaceholder() {
  return (
    <Wrapper>
      <Text
        color="var(--ads-v2-color-black-300)"
        kind="heading-l"
        renderAs="h2"
      >
        No Query/JS selected
      </Text>
    </Wrapper>
  );
}

export default CanvasCodePlaceholder;
