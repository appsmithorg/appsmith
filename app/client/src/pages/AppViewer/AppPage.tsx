import React from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { ContainerWidgetProps } from "widgets/ContainerWidget";

const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${props => props.width}px;
  margin: 0 auto;
`;

type AppPageProps = {
  dsl: ContainerWidgetProps<WidgetProps>;
};

export const AppPage = (props: AppPageProps) => {
  return (
    <PageView width={props.dsl.rightColumn}>
      {props.dsl.widgetId &&
        WidgetFactory.createWidget(props.dsl, RenderModes.PAGE)}
    </PageView>
  );
};

export default AppPage;
