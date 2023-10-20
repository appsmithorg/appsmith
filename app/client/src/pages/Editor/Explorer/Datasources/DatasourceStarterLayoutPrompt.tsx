import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  position: absolute;
  right: 0;
  width: 296px;
  background: red;
  height: 100px;
`;

function DatasourceStarterLayoutPrompt() {
  return (
    <Wrapper>
      <p>test</p>
    </Wrapper>
  );
}

export default DatasourceStarterLayoutPrompt;
