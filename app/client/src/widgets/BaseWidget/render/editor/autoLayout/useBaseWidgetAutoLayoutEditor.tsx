import type { ReactNode } from "react";
import { useBaseWidgetDebugger } from "widgets/BaseWidget/debugger/useBaseWidgetDebugger";
import { getWidgetComponent } from "./utils";

export const useBaseWidgetAutoLayoutEditor = (props: {
  type: string;
  deferRender: boolean;
  isFlexChild: boolean;
  detachFromLayout: boolean;
  resizeDisabled: boolean;
}) => {
  let content: ReactNode;
  const { addErrorBoundary, getErrorCount } = useBaseWidgetDebugger();
  const getPageView = (content: ReactNode = null) => {
    return content;
  };
  const getCanvasView = (content: ReactNode = null): ReactNode => {
    return content || getPageView();
  };
  return {
    render: () => {
      content = getWidgetComponent(props, getCanvasView());
      content = addErrorBoundary(content);
      if (!props.detachFromLayout) {
        // if (!props.resizeDisabled && props.type !== "SKELETON_WIDGET") {
        //   content = this.makeResizable(content);
        // }
        // content = this.showWidgetName(content);
        // content = this.makeDraggable(content);
        // content = this.makeSnipeable(content);
        // // NOTE: In sniping mode we are not blocking onClick events from PositionWrapper.
        // content = this.makeFlex(content);
      }

      return content;
    },
  };
};
