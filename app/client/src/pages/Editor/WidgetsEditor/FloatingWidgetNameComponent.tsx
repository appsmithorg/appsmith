/* eslint-disable no-console */
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getWidgetPositions } from "selectors/entitiesSelector";
import { getSelectedWidgetDsl } from "selectors/ui";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

const Container = styled.div<{
  top: number;
  left: number;
}>`
  position: absolute;
  z-index: 2;
  background-color: rgb(239, 117, 65);
  color: rgb(255, 255, 255);
  font-size: 14px;
  line-height: 18px;
  padding: 4px 6px;
  padding-bottom: 4px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border-color: transparent;
  top: ${({ top }) => top}px;
  left: ${({ left }) => left}px;
`;

export const FloatingWidgetNameComponent = (props: { canvasWidth: number }) => {
  const [top, setTop] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);
  const [widgetName, setWidgetName] = useState<string>("");

  const selectedWidgets: FlattenedWidgetProps[] = useSelector(
    getSelectedWidgetDsl(),
  );
  const widgetPositions = useSelector(getWidgetPositions);

  useEffect(() => {
    if (!widgetPositions) setWidgetName("");
    if (!selectedWidgets.length && widgetName) setWidgetName("");
    const selectedWidget: FlattenedWidgetProps = selectedWidgets[0];
    if (!selectedWidget) return;
    const widgetPosition = widgetPositions[selectedWidget.widgetId];
    if (!widgetPosition) return;
    setTop(widgetPosition.top + 6);
    setLeft(
      widgetPosition.left +
        widgetPosition.width -
        selectedWidget.widgetName.length * 7 -
        12,
    );
    console.log("####", { widgetPosition, canvasWidth: props.canvasWidth });
    // setLeft(props.canvasWidth - widgetPosition.left - widgetPosition.width);
    setWidgetName(selectedWidget.widgetName);
  }, [selectedWidgets]);

  if (!widgetName) return null;

  return (
    <Container left={left} top={top}>
      {widgetName}
    </Container>
  );
};

export default FloatingWidgetNameComponent;
