import React from "react";
import styled from "styled-components";
import { Text } from "@appsmith/ads";

interface Props {
  title: string;
  rightIcon?: React.ReactNode;
  className?: string;
}

const Container = styled.div`
  background: var(--ads-v2-color-gray-50);
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  padding-right: var(--ads-v2-spaces-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  span {
    line-height: 20px;
  }
`;

function PaneHeader(props: Props) {
  return (
    <Container className={props.className}>
      <Text kind="heading-xs">{props.title}</Text>
      {props.rightIcon ? props.rightIcon : null}
    </Container>
  );
}

export default PaneHeader;
