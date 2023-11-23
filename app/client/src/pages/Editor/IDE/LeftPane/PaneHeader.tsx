import React from "react";
import styled from "styled-components";
import { Text } from "design-system";

interface Props {
  title: string;
  rightIcon?: React.ReactNode;
}

const Container = styled.div`
  background: var(--ads-v2-color-gray-50);
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    line-height: 20px;
  }
`;

function PaneHeader(props: Props) {
  return (
    <Container>
      <Text kind="heading-xs">{props.title}</Text>
      {props.rightIcon ? props.rightIcon : null}
    </Container>
  );
}

export default PaneHeader;
