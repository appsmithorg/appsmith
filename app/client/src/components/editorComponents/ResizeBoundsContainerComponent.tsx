import React, { useRef } from "react";
import ContainerComponent from "components/designSystems/appsmith/ContainerComponent";
import { WidgetProps } from "widgets/BaseWidget";
import { generateClassName } from "utils/generators";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

type ContainerProps = WidgetProps;

const ResizeBoundsContainerComponent = (props: ContainerProps) => {
  const container = useRef(null);
  return (
    <ContainerComponent
      isMainContainer={props.widgetId === MAIN_CONTAINER_WIDGET_ID}
      className={generateClassName(props.widgetId)}
      ref={container}
      {...props}
    />
  );
};

export default ResizeBoundsContainerComponent;
