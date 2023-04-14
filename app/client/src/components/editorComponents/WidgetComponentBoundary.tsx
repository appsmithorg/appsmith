import { WIDGET_COMPONENT_BOUNDARY_CLASS } from "constants/componentClassNameConstants";
import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";

type Props = { children: ReactNode; widgetType: string };

const WidgetComponentBoundaryWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

function WidgetComponentBoundary(props: Props) {
  return (
    <WidgetComponentBoundaryWrapper className={WIDGET_COMPONENT_BOUNDARY_CLASS}>
      {props.children}
    </WidgetComponentBoundaryWrapper>
  );
}

export default WidgetComponentBoundary;
