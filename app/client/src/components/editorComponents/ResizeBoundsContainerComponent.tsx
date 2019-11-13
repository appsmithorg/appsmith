import React, { useRef } from "react";
import ContainerComponent from "components/designSystems/appsmith/ContainerComponent";
import { WidgetProps } from "widgets/BaseWidget";
import { generateClassName } from "utils/generators";

type ContainerProps = WidgetProps;

const ResizeBoundsContainerComponent = (props: ContainerProps) => {
  const container = useRef(null);
  return (
    <ContainerComponent
      className={generateClassName(props.widgetId)}
      ref={container}
      {...props}
    />
  );
};

export default ResizeBoundsContainerComponent;
