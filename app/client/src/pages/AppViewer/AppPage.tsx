import React from "react";
import styled from "styled-components";
import { WidgetProps } from "../../widgets/BaseWidget";
import { RenderModes } from "../../constants/WidgetConstants";
import WidgetFactory from "../../utils/WidgetFactory";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const PageView = styled.div`
  flex-grow: 1;
  height: 100%;
  margin-top: ${props => props.theme.spaces[1]}px;
  position: relative;
`;

type AppPageProps = {
  dsl: ContainerWidgetProps<WidgetProps>;
};

export const AppPage = (props: AppPageProps) => {
  return (
    <PageView>
      {props.dsl.widgetId &&
        WidgetFactory.createWidget(props.dsl, RenderModes.PAGE)}
    </PageView>
  );
};

export default AppPage;
