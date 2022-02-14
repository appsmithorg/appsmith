import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getPluginByPackageName } from "selectors/entitiesSelector";
import styled from "styled-components";

const StyledDatasourceChip = styled.div`
  background-color: rgba(248, 248, 248, 0.5);
  border: 1px solid #e7e7e7;
  padding: 4px 9px;
  display: inline-flex;
  align-items: center;
  .image {
    height: 15px;
    width: 15px;
    display: inline-block;
  }
  span {
    margin-left: 6px;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: -0.221538px;
    color: #191919;
  }
`;

interface DatasourceChipProps {
  className?: string;
  pluginPackageName: string;
}

function DatasourceChip(props: DatasourceChipProps) {
  const plugin = useSelector((state: AppState) =>
    getPluginByPackageName(state, props.pluginPackageName),
  );

  if (!plugin) return null;

  return (
    <StyledDatasourceChip className={props.className}>
      <img className="image" src={plugin.iconLocation} />
      <span>{plugin.name}</span>
    </StyledDatasourceChip>
  );
}

export default DatasourceChip;
