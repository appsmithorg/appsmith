import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import { Callout } from "design-system";
import type { CalloutProps } from "design-system";
interface CollapsibleHelpProps {
  children?: ReactNode;
}

const Container = styled.div`
  padding: 10px 10px;
  position: relative;
  display: flex;
  align-items: center;

  margin-top: 18px;
  margin-bottom: 19px;
  margin-left: 6px;
  width: 89%;
`;

export default function CollapsibleHelp(
  props: CollapsibleHelpProps & CalloutProps,
) {
  return (
    <Container>
      <Callout kind="warning" {...props}>
        {props.children}
      </Callout>
    </Container>
  );
}
