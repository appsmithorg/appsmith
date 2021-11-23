import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { PanelStack, Classes } from "@blueprintjs/core";

import styled from "constants/DefaultTheme";
import { get } from "lodash";
import { getSelectedWidgets } from "selectors/ui";
import PropertyPaneView from "./PropertyPaneView";

const StyledPanelStack = styled(PanelStack)`
  height: 100%;
  width: 100%;
  margin: 0;
  &&& .bp3-panel-stack-view {
    margin: 0;
    border: none;
  }
  overflow: hidden;
  position: static;
  &&& .${Classes.PANEL_STACK_VIEW} {
    position: static;
    overflow: hidden;
    height: 100%;
  }
`;

function PropertyPane() {
  const selectedWidgets = useSelector(getSelectedWidgets);
  const panelWrapperRef = useRef<HTMLDivElement>(null);

  // TODO: add analytics code
  if (
    selectedWidgets.length === 0 ||
    get(selectedWidgets, "0.disablePropertyPane")
  ) {
    return null;
  }

  return (
    <div
      className={"t--propertypane overflow-y-auto h-full"}
      data-testid={"t--propertypane"}
      onClick={(e: any) => {
        e.stopPropagation();
      }}
      ref={panelWrapperRef}
    >
      <StyledPanelStack
        initialPanel={{
          component: PropertyPaneView,
        }}
        onOpen={() => {
          const parent = panelWrapperRef.current;
          parent?.scrollTo(0, 0);
        }}
        showPanelHeader={false}
      />
    </div>
  );
}

export default PropertyPane;
