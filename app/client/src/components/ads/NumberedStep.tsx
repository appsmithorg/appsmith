import { getTypographyByKey } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${(props) => props.theme.colors.numberedStep.number};
  height: 100%;
`;

const Line = styled.div`
  width: 1px;
  flex: 1;
  background-color: ${(props) => props.theme.colors.numberedStep.line};
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
