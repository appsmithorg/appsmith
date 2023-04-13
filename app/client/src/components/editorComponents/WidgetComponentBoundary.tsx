import { WIDGET_COMPONENT_BOUNDARY_CLASS } from "constants/componentClassNameConstants";
import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import type { WidgetProps } from "widgets/BaseWidget";

type Props = { children: ReactNode; widgetProps: WidgetProps };

const WidgetComponentBoundaryWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

function WidgetComponentBoundary(props: Props) {
  return (
    <WidgetComponentBoundaryWrapper
      className={
        props.widgetProps.type !== "CANVAS_WIDGET"
          ? WIDGET_COMPONENT_BOUNDARY_CLASS
          : undefined
      }
    >
      {props.children}
    </WidgetComponentBoundaryWrapper>
  );
}

export default WidgetComponentBoundary;
