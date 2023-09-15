import PositionedContainer from "components/designSystems/appsmith/PositionedContainer";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const PositionedComponentLayer = (props: BaseWidgetProps) => {
  return (
    <PositionedContainer
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      focused={props.focused}
      isDisabled={props.isDisabled}
      isVisible={props.isVisible}
      leftColumn={props.leftColumn}
      noContainerOffset={props.noContainerOffset}
      parentColumnSpace={props.parentColumnSpace}
      parentId={props.parentId}
      parentRowSpace={props.parentRowSpace}
      ref={props.wrapperRef}
      resizeDisabled={props.resizeDisabled}
      selected={props.selected}
      topRow={props.topRow}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetType={props.type}
    >
      {props.children}
    </PositionedContainer>
  );
};
