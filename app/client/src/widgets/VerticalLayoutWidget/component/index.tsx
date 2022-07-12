import React, { ReactNode } from "react";
import styled from "styled-components";

const Container = styled.div<VerticalLayoutComponentProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
`;

function VerticalLayoutComponent(props: VerticalLayoutComponentProps) {
  return <Container>{props.children}</Container>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VerticalLayoutComponentProps {
  children?: ReactNode;
}

export default VerticalLayoutComponent;
