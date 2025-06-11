import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { PanelStack, Classes } from "@blueprintjs/core";

import { get } from "lodash";
import { getSelectedWidgets } from "selectors/ui";
import PropertyPaneView from "./PropertyPaneView";
import { retryPromise } from "utils/AppsmithUtils";

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

  // Track registration state
  const [controlsRegistered, setControlsRegistered] = useState(false);

  useEffect(() => {
    const loadPropertyControlBuilders = async () => {
      const module = await retryPromise(
        async () =>
          import(
            /* webpackChunkName: "PropertyControlRegistry" */ "utils/PropertyControlRegistry"
          ),
      );

      module.default.registerPropertyControlBuilders();

      setControlsRegistered(true);
    };

    loadPropertyControlBuilders();
  }, []);

  // TODO: add analytics code
  if (
    !controlsRegistered ||
    selectedWidgets.length === 0 ||
    get(selectedWidgets, "0.disablePropertyPane")
  ) {
    return null;
  }

  return (
    <div
      className={"t--propertypane overflow-y-auto h-full"}
      data-testid={"t--propertypane"}
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
