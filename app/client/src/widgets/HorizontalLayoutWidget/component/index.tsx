import React, { ReactNode } from "react";
import styled from "styled-components";

const HorizontalContainer = styled.div``;

function HorizontalLayoutComponent(props: HorizontalLayoutComponentProps) {
  return <HorizontalContainer>{props.children}</HorizontalContainer>;
}

export interface HorizontalLayoutComponentProps {
  children?: ReactNode;
}

export default HorizontalLayoutComponent;
