import React from "react";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDefaultPlugin } from "selectors/entitiesSelector";
import styled from "styled-components";
import { Tag } from "design-system";

const StyledDatasourceChip = styled(Tag)`
  .image {
    height: 13px;
    margin-right: 4px;
    display: inline-block;
  }

  .ads-v2-text {
    display: flex;
    align-items: center;
  }
`;

interface DatasourceChipProps {
  className?: string;
  pluginPackageName: string;
}

function DatasourceChip(props: DatasourceChipProps) {
  const plugin = useSelector((state: AppState) =>
    getDefaultPlugin(state, props.pluginPackageName),
  );

  if (!plugin) return null;

  return (
    <StyledDatasourceChip isClosable={false} size="md">
      <img className="image" src={plugin.iconLocation} />
      {plugin.name}
    </StyledDatasourceChip>
  );
}

export default DatasourceChip;
