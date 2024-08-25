import React from "react";
import { Text, TextType } from "@appsmith/ads-old";
import { Icon, Tooltip } from "@appsmith/ads";
import type { Datasource } from "entities/Datasource";
import styled from "styled-components";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { PluginImage } from "pages/Editor/DataSourceEditor/DSFormHeader";
import { isEnvironmentConfigured } from "ee/utils/Environments";
import type { Plugin } from "api/PluginApi";
import {
  isDatasourceAuthorizedForQueryCreation,
  isGoogleSheetPluginDS,
} from "utils/editorContextUtils";

const ListItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  height: 64px;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 10px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.4 : 1)};
  border-radius: var(--ads-v2-border-radius);
  &.active {
    background-color: var(--ads-v2-color-bg-muted);
  }
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
  img {
    width: 24px;
    height: 24px;
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
    max-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 4px;
  }
  .ads-v2-icon {
    margin-left: ${(props) => props.theme.spaces[2]}px;
  }
`;
function ListItemWrapper(props: {
  currentEnvironment: string;
  ds: Datasource;
  selected?: boolean;
  plugin: Plugin;
  onClick: (ds: Datasource) => void;
}) {
  const { currentEnvironment, ds, onClick, plugin, selected } = props;
  const isPluginAuthorized = isGoogleSheetPluginDS(plugin?.packageName)
    ? isDatasourceAuthorizedForQueryCreation(
        ds,
        plugin ?? {},
        currentEnvironment,
      )
    : isEnvironmentConfigured(ds, currentEnvironment);
  return (
    <ListItem
      className={`t--ds-list ${selected ? "active" : ""}`}
      onClick={() => onClick(ds)}
    >
      <PluginImage alt="Datasource" src={getAssetUrl(plugin?.iconLocation)} />
      <ListLabels>
        <Tooltip content={ds.name} placement="left">
          <DsTitle>
            <Text
              className="t--ds-list-title"
              color="var(--ads-v2-color-fg-emphasis)"
              type={TextType.H4}
            >
              {ds.name}
            </Text>
            <Icon
              color={
                isPluginAuthorized
                  ? "var(--ads-v2-color-fg-success)"
                  : "var(--ads-v2-color-fg-error)"
              }
              name={isPluginAuthorized ? "oval-check" : "info"}
              size="md"
            />
          </DsTitle>
        </Tooltip>
        <Text color="var(--ads-v2-color-fg)" type={TextType.H5}>
          {plugin?.name}
        </Text>
      </ListLabels>
    </ListItem>
  );
}

export default ListItemWrapper;
