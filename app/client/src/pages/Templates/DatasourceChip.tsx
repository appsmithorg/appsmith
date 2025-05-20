import React from "react";
import { useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getDefaultPlugin } from "ee/selectors/entitiesSelector";
import styled from "styled-components";
import { Tag } from "@appsmith/ads";

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

  .plugin-name {
    flex-shrink: 0;
  }
`;

interface DatasourceChipProps {
  className?: string;
  pluginPackageName: string;
}

function DatasourceChip(props: DatasourceChipProps) {
  const plugin = useSelector((state: DefaultRootState) =>
    getDefaultPlugin(state, props.pluginPackageName),
  );

  if (!plugin) return null;

  return (
    <StyledDatasourceChip isClosable={false} size="md">
      <img className="image" src={plugin.iconLocation} />
      <span className="plugin-name">{plugin.name}</span>
    </StyledDatasourceChip>
  );
}

export default DatasourceChip;
