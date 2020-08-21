import React, { useRef, MutableRefObject, useEffect } from "react";
import styled from "styled-components";
import Divider from "components/editorComponents/Divider";
import { useFilteredEntities } from "./hooks";
import Search from "./ExplorerSearch";
import ExplorerPageGroup from "./Pages/PageGroup";
import ExplorerDatasourcesGroup from "./Datasources/DatasourcesGroup";
import { scrollbarDark } from "constants/DefaultTheme";
import { NonIdealState, Classes } from "@blueprintjs/core";
import { ENTITY_EXPLORER_SEARCH_LOCATION_HASH } from "constants/Explorer";
import { useLocation } from "react-router";

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
  const {
    widgets,
    actions,
    dataSources,
    currentPageId,
    pages,
    plugins,
    searchKeyword,
    clearSearch,
  } = useFilteredEntities(searchInputRef);

  const location = useLocation();
  useEffect(() => {
    if (location.hash === ENTITY_EXPLORER_SEARCH_LOCATION_HASH) {
      searchInputRef.current?.focus();
    }
  }, [location, searchInputRef]);

  const explorerPageGroup = (
    <ExplorerPageGroup
      widgets={widgets}
      actions={actions}
      currentPageId={currentPageId}
      searchKeyword={searchKeyword}
      pages={pages}
      step={0}
    />
  );

  const datasourcesGroup = (
    <ExplorerDatasourcesGroup
      dataSources={dataSources}
      plugins={plugins}
      searchKeyword={searchKeyword}
      step={0}
    />
  );

  const noResults =
    widgets.length === 0 &&
    actions.length === 0 &&
    dataSources.length === 0 &&
    !!searchKeyword;

  const noPageEntities =
    widgets.length === 0 && actions.length === 0 && !!searchKeyword;

  const noDatsourceEntities = dataSources.length === 0 && !!searchKeyword;

  const noResultMessage = (
    <NoResult
      className={Classes.DARK}
      description="Try modifying the search keyword."
      title="No entities found"
      icon="search"
    />
  );

  return (
    <Wrapper>
      <Search ref={searchInputRef} clear={clearSearch} />
      {!noPageEntities && explorerPageGroup}
      {noResults && noResultMessage}
      <StyledDivider />
      {!noDatsourceEntities && datasourcesGroup}
    </Wrapper>
  );
};

EntityExplorer.displayName = "EntityExplorer";

EntityExplorer.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default EntityExplorer;
