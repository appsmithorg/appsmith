import { Colors } from "constants/Colors";
import {
  Icon,
  IconSize,
  Text,
  TextType,
  TooltipComponent,
} from "design-system-old";
import type { Datasource } from "entities/Datasource";
import { PluginImage } from "pages/Editor/DataSourceEditor/JSONtoForm";
import React from "react";
import styled from "styled-components";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const ListItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  height: 64px;
  width: 100%;
  padding: 10px 18px;
  margin-bottom: 10px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.4 : 1)};
  &.active,
  &:hover {
    background-color: ${Colors.GEYSER_LIGHT};
  }
  img {
    width: 24pxx;
    height: 22.5px;
  }
`;

const ListLabels = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const DsTitle = styled.div`
  width: 100%;
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[1]}px;
  .t--ds-list-title {
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cs-icon {
    margin-left: ${(props) => props.theme.spaces[2]}px;
  }
`;
function ListItemWrapper(props: {
  ds: Datasource;
  selected?: boolean;
  plugin: {
    image: string;
    name: string;
  };
  onClick: (ds: Datasource) => void;
}) {
  const { ds, onClick, plugin, selected } = props;
  return (
    <ListItem
      className={`t--ds-list ${selected ? "active" : ""}`}
      onClick={() => onClick(ds)}
    >
      <PluginImage alt="Datasource" src={getAssetUrl(plugin.image)} />
      <ListLabels>
        <DsTitle>
          <Text
            className="t--ds-list-title"
            color={Colors.GRAY_800}
            type={TextType.H4}
          >
            {ds.name}
          </Text>
          <TooltipComponent content={ds.name} position="left">
            <Icon
              className="t--ds-list-icon"
              fillColor={ds.isConfigured ? Colors.GREEN : Colors.ERROR_RED}
              name={ds.isConfigured ? "oval-check" : "info"}
              size={IconSize.MEDIUM}
            />
          </TooltipComponent>
        </DsTitle>
        <Text color={Colors.GRAY_700} type={TextType.H5}>
          {plugin.name}
        </Text>
      </ListLabels>
    </ListItem>
  );
}

export default ListItemWrapper;
