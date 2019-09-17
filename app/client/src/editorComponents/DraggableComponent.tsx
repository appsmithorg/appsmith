import * as React from "react";
import { WidgetProps } from "../widgets/BaseWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "../assets/images/blank.png";
import { ContainerProps } from "./ContainerComponent";

type DraggableComponentProps = WidgetProps & ContainerProps;

const DraggableComponent = (props: DraggableComponentProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    item: props,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <React.Fragment>
      <DragPreviewImage connect={preview} src={blankImage} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: props.style
            ? props.style.xPosition + props.style.xPositionUnit
            : 0,
          top: props.style
            ? props.style.yPosition + props.style.yPositionUnit
            : 0,
        }}
      >
        {props.children}
      </div>
    </React.Fragment>
  );
};

// class DraggableComponent extends React.Component<DraggableProps, WidgetState> {
//   render() {
//     return props.connectDragSource(
//       ,
//     );
//   }
// }

// const widgetSource = {
//   beginDrag(props: WidgetProps) {
//     return {
//       widgetId: props.widgetId,
//       widgetType: props.type,
//     };
//   },
// };

const widgetType = (props: WidgetProps) => {
  return props.type;
};

// function collect(connect: DragSourceConnector, monitor: DragSourceMonitor) {
//   return {
//     connectDragSource: connect.dragSource(),
//     isDragging: monitor.isDragging(),
//   };
// }

// export default DragSource(widgetType, widgetSource, collect)(
//   DraggableComponent,
// );

export default DraggableComponent;
