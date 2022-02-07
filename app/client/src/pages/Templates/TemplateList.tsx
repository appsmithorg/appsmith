import React from "react";
import styled from "styled-components";
import Template from "./Template";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 19px;
  padding-top: 24px;
`;

function TemplateList() {
  return (
    <Wrapper>
      <Template />
      <Template />
    </Wrapper>
  );
}

export default TemplateList;
