import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  position: absolute !important;
  top: 20px;
  width: 50%;
  height: 71px;
  padding: 8px 8px 16px 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
`;

export default function AnonymousDataPopup() {
  return <Wrapper>Hey</Wrapper>;
}
