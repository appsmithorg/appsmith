import React, { useState } from "react";
import styled from "styled-components";
import WidgetSidebarWithTags from "../../../Editor/WidgetSidebarWithTags";
import { tailwindLayers } from "../../../../constants/Layers";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  widgetsExistCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import BlankState from "pages/IDE/components/BlankState";
import history from "utils/history";
import { importSvg } from "design-system-old";
import { pageEntityUrl } from "RouteBuilder";
import { PageNavState } from "pages/IDE/ideReducer";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-widgets.svg"),
);

const Container = styled.div`
  height: 100%;
  overflow-y: scroll;
`;

const WidgetSidebar = () => {
  const [showBlankState, setShowBlankState] = useState(true);
  const currentPageId = useSelector(getCurrentPageId);
  const widgetsExist = useSelector(widgetsExistCurrentPage);

  if (!widgetsExist && showBlankState) {
    return (
      <div className="h-full w-full flex">
        <BlankState
          buttonText="Add widgets"
          description="Add some widgets to the canvas to start building your UI"
          image={DataIcon}
          onClick={() => {
            history.push(
              pageEntityUrl({ pageId: currentPageId || "" }, PageNavState.UI),
            );
            setShowBlankState(false);
          }}
        />
      </div>
    );
  }

  return (
    <Container
      className={`flex-1 flex flex-col overflow-hidden pt-2 ${tailwindLayers.entityExplorer}`}
    >
      <WidgetSidebarWithTags isActive />
    </Container>
  );
};

export default WidgetSidebar;
