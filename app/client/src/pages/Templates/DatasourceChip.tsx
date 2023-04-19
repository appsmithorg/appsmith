import React from "react";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDefaultPlugin } from "selectors/entitiesSelector";
import styled from "styled-components";
import { Button } from "design-system";

const StyledDatasourceChip = styled(Button)`
  .image {
    height: 15px;
    width: 15px;
    display: inline-block;
  }
  .text {
    margin-left: ${(props) => props.theme.spaces[2]}px;
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
    // <StyledDatasourceChip className={props.className}>
    //   <img className="image" src={getAssetUrl(plugin.iconLocation)} />
    //   <span>{plugin.name}</span>
    // </StyledDatasourceChip>
    <StyledDatasourceChip kind="secondary" size="sm">
      <img className="image" src={plugin.iconLocation} />
      <span className="text">{plugin.name}</span>
    </StyledDatasourceChip>
  );
}

export default DatasourceChip;
