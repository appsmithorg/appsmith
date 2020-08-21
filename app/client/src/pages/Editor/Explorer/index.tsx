import React, { useRef, MutableRefObject, useEffect, useState } from "react";
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

const EntityExplorer = () => {
  const searchInputRef: MutableRefObject<HTMLInputElement | null> = useRef(
    null,
  );

  const explorerRef = useRef<HTMLDivElement | null>(null);
  const { searchKeyword, clearSearch } = useFilteredEntities(searchInputRef);

  const location = useLocation();
  useEffect(() => {
    if (location.hash === ENTITY_EXPLORER_SEARCH_LOCATION_HASH) {
      searchInputRef.current?.focus();
    }
  }, [location, searchInputRef]);

  const [noResults, setNoResults] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      if (searchKeyword && explorerRef.current) {
        const pages = explorerRef.current.getElementsByClassName("pages");
        const datasources = explorerRef.current.getElementsByClassName(
          "plugins",
        );
        console.log({ pages, datasources });
        if (pages.length === 0 && datasources.length === 0) {
          setNoResults(true);
        } else {
          setNoResults(false);
        }
      } else setNoResults(false);
    }, 0);
  }, [searchKeyword]);
  const noResultMessage = (
    <NoResult
      className={Classes.DARK}
      description="Try modifying the search keyword."
      title="No entities found"
      icon="search"
    />
  );

  return (
    <Wrapper ref={explorerRef}>
      <Search ref={searchInputRef} clear={clearSearch} />
      {noResults && noResultMessage}
      <ExplorerPageGroup searchKeyword={searchKeyword} step={0} />
      <Divider />
      <ExplorerDatasourcesGroup searchKeyword={searchKeyword} step={0} />
    </Wrapper>
  );
};

EntityExplorer.displayName = "EntityExplorer";

EntityExplorer.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default EntityExplorer;
