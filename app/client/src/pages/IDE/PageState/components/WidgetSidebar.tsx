import React, { useEffect } from "react";
import styled from "styled-components";
import WidgetSidebarWithTags from "../../../Editor/WidgetSidebarWithTags";
import { tailwindLayers } from "../../../../constants/Layers";
import { setIdeSidebarWidth } from "pages/IDE/ideActions";
import { useDispatch } from "react-redux";

const Container = styled.div`
  height: 100%;
  overflow-y: scroll;
`;

const WidgetSidebar = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setIdeSidebarWidth(300));
  }, []);

  return (
    <Container
      className={`flex-1 flex flex-col overflow-hidden pt-2 ${tailwindLayers.entityExplorer}`}
    >
      <WidgetSidebarWithTags isActive />
    </Container>
  );
};

export default WidgetSidebar;
