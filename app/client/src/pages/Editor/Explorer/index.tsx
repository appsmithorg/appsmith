import React, { useRef, MutableRefObject } from "react";
import styled from "styled-components";
import Divider from "components/editorComponents/Divider";
import { useFilteredEntities } from "./hooks";
import Search from "./ExplorerSearch";
import ExplorerPageGroup from "./Pages/PageGroup";
import ExplorerDatasourcesGroup from "./Datasources/DatasourcesGroup";
import { scrollbarDark } from "constants/DefaultTheme";

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  ${scrollbarDark};
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
    isFiltered,
    clearSearch,
  } = useFilteredEntities(searchInputRef);

  return (
    <Wrapper>
      <Search ref={searchInputRef} clear={clearSearch} />
      <ExplorerPageGroup
        widgets={widgets}
        actions={actions}
        currentPageId={currentPageId}
        isFiltered={isFiltered}
        pages={pages}
        step={0}
      />
      <Divider />
      <ExplorerDatasourcesGroup
        dataSources={dataSources}
        plugins={plugins}
        step={0}
      />
    </Wrapper>
  );
};

EntityExplorer.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default EntityExplorer;
