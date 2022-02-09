import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import { Datasource } from "entities/Datasource";
import { PluginImage } from "pages/Editor/DataSourceEditor/JSONtoForm";
import React from "react";
import styled from "styled-components";

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
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }
`;

const ListLabels = styled.div`
  display: flex;
  flex-direction: column;
  .t--ds-list-description {
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

function ListItemWrapper(props: {
  ds: Datasource;
  selected?: boolean;
  isConfigured?: boolean;
  plugin: {
    image: string;
    name: string;
  };
  onClick: (ds: Datasource, isConfigured?: boolean) => void;
}) {
  const { ds, isConfigured, onClick, plugin, selected } = props;
  return (
    <ListItem
      className={`t--ds-list ${selected ? "active" : ""}`}
      disabled={isConfigured}
      onClick={() => onClick(ds, isConfigured)}
    >
      <PluginImage alt="Datasource" src={plugin.image} />
      <ListLabels>
        <Text
          color={Colors.GRAY_800}
          style={{ marginBottom: 2 }}
          type={TextType.H4}
        >
          {plugin.name}
        </Text>
        <Text
          className="t--ds-list-description"
          color={Colors.GRAY_700}
          type={TextType.H5}
        >
          {ds.name}
        </Text>
      </ListLabels>
    </ListItem>
  );
}

export default ListItemWrapper;
