import React, { useRef, MutableRefObject } from "react";
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
import { NonIdealState, Classes } from "@blueprintjs/core";

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

const EntityExplorer = () => {
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

  return (
    <Wrapper ref={explorerRef}>
      <Search ref={searchInputRef} clear={clearSearch} />
      <ExplorerPageGroup
        searchKeyword={searchKeyword}
        step={0}
        widgets={widgets}
        actions={actions}
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
