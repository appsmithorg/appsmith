import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  & h1 {
    font-size: ${(props) => props.theme.fontSizes[3]}px;
    letter-spacing: 3px;
    font-weight: ${(props) => props.theme.fontWeights[2]};
  }
`;

export function ExplorerTitle() {
  return (
    <Wrapper>
      <h1>EXPLORER</h1>
    </Wrapper>
  );
}

export default ExplorerTitle;
