import React from "react";
import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  cursor: pointer;
`;

function ScrollToLatest({ scrollToBottom }: { scrollToBottom: () => void }) {
  return <Container onClick={scrollToBottom}>View latest</Container>;
}

export default ScrollToLatest;
