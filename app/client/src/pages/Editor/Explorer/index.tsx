import React, { useRef, MutableRefObject, useCallback } from "react";
import styled from "styled-components";
import Divider from "components/editorComponents/Divider";
import {
  useFilteredEntities,
  useWidgets,
  useActions,
  useFilteredDatasources,
} from "./hooks";
import Search from "./ExplorerSearch";
import ExplorerPageGroup from "./Pages/PageGroup";
import ExplorerDatasourcesGroup from "./Datasources/DatasourcesGroup";
import { scrollbarDark } from "constants/DefaultTheme";
import { NonIdealState, Classes, IPanelProps } from "@blueprintjs/core";
import WidgetSidebar from "../WidgetSidebar";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { useParams } from "react-router";
import { ExplorerURLParams } from "./helpers";
const Wrapper = styled.div`
  height: 100%;
  overflow-y: scroll;
  ${scrollbarDark};
`;

const NoResult = styled(NonIdealState)`
  &.${Classes.NON_IDEAL_STATE} {
    height: auto;
  }
`;

const StyledDivider = styled(Divider)`
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

const EntityExplorer = (props: IPanelProps) => {
  const { applicationId, pageId } = useParams<ExplorerURLParams>();
  const searchInputRef: MutableRefObject<HTMLInputElement | null> = useRef(
    null,
  );

  const explorerRef = useRef<HTMLDivElement | null>(null);
  const { searchKeyword, clearSearch } = useFilteredEntities(searchInputRef);
  const datasources = useFilteredDatasources(searchKeyword);

  const widgets = useWidgets(searchKeyword);
  const actions = useActions(searchKeyword);

  let noResults = false;
  if (searchKeyword) {
    const noWidgets = Object.values(widgets).filter(Boolean).length === 0;
    const noActions =
      Object.values(actions).filter(actions => actions && actions.length > 0)
        .length === 0;

    const noDatasource = !datasources || datasources.length === 0;
    noResults = noWidgets && noActions && noDatasource;
  }
  const { openPanel } = props;
  const showWidgetsSidebar = useCallback(() => {
    history.push(BUILDER_PAGE_URL(applicationId, pageId));
    openPanel({ component: WidgetSidebar });
  }, [openPanel, applicationId, pageId]);

  return (
    <Wrapper ref={explorerRef}>
      <Search ref={searchInputRef} clear={clearSearch} />
      <ExplorerPageGroup
        searchKeyword={searchKeyword}
        step={0}
        widgets={widgets}
        actions={actions}
        showWidgetsSidebar={showWidgetsSidebar}
      />
      {noResults && (
        <NoResult
          className={Classes.DARK}
          description="Try modifying the search keyword."
          title="No entities found"
          icon="search"
        />
      )}
      <StyledDivider />
      <ExplorerDatasourcesGroup
        searchKeyword={searchKeyword}
        step={0}
        datasources={datasources}
      />
    </Wrapper>
  );
};

EntityExplorer.displayName = "EntityExplorer";

EntityExplorer.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default EntityExplorer;
