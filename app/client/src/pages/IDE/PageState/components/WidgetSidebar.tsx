import React from "react";
import styled from "styled-components";
import WidgetSidebarWithTags from "../../../Editor/WidgetSidebarWithTags";
import { tailwindLayers } from "../../../../constants/Layers";

const Container = styled.div`
  height: 100%;
  overflow-y: scroll;
`;

const WidgetSidebar = () => {
  return (
    <Container
      className={`flex-1 flex flex-col overflow-hidden pt-2 ${tailwindLayers.entityExplorer}`}
    >
      <WidgetSidebarWithTags isActive />
    </Container>
  );
};

export default WidgetSidebar;
