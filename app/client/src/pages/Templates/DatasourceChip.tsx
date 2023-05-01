import { Colors } from "constants/Colors";
import { getTypographyByKey } from "design-system-old";
import React from "react";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDefaultPlugin } from "selectors/entitiesSelector";
import styled from "styled-components";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const StyledDatasourceChip = styled.div`
  background-color: rgba(248, 248, 248, 0.5);
  border: 1px solid ${Colors.MERCURY_2};
  padding: ${(props) =>
    `${props.theme.spaces[1]}px ${props.theme.spaces[3]}px`};
  display: inline-flex;
  align-items: center;
  .image {
    height: 15px;
    width: 15px;
    display: inline-block;
  }
  span {
    margin-left: ${(props) => props.theme.spaces[2]}px;
    ${getTypographyByKey("h6")}
    letter-spacing: -0.221538px;
    color: var(--appsmith-color-black-900);
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
    <StyledDatasourceChip className={props.className}>
      <img className="image" src={getAssetUrl(plugin.iconLocation)} />
      <span>{plugin.name}</span>
    </StyledDatasourceChip>
  );
}

export default DatasourceChip;
