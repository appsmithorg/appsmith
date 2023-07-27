import React from "react";
import styled from "styled-components";
import { messages } from "../constants";

const Container = styled.div`
  height: 100%;
  width: 100%;
  background: var(--ads-v2-color-bg);
  position: absolute;
  top: 0px;
  left: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}`;

export function EmptyChartData() {
  return (
    <Container>
      <p>{messages.EmptyData}</p>
    </Container>
  );
}
