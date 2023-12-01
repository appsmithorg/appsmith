import React from "react";
import { useSelector } from "react-redux";
import { Flex } from "design-system";
import styled from "styled-components";

import { selectFilesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";

const JSContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const JSSection = () => {
  const files = useSelector(selectFilesForExplorer);
  const activeActionId = useActiveAction();

  return (
    <JSContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      paddingTop="spaces-3"
    >
      {files.map(({ entity, type }: any) => {
        if (type === "JS" && entity.id) {
          return (
            <ExplorerJSCollectionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        }
      })}
    </JSContainer>
  );
};

export { JSSection };
