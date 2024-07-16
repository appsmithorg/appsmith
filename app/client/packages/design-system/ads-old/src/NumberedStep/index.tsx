import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "../constants/typography";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  ${getTypographyByKey("p1")};
  color: var(--ads-numbered-step-text-color);
  height: 100%;
`;

const Line = styled.div`
  width: 1px;
  flex: 1;
  background-color: var(--ads-numbered-step-line-background-color);
`;

function NumberedStep(props: { current: number; total: number }) {
  const { current, total } = props;
  return (
    <Container>
      <span>
        {current}/{total}
      </span>
      <Line />
    </Container>
  );
}

export default NumberedStep;
