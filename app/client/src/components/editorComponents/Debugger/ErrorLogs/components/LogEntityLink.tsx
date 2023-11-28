import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { keyBy } from "lodash";
import type { LogItemProps } from "../ErrorLogItem";
import { Colors } from "constants/Colors";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import EntityLink from "../../EntityLink";
import { DebuggerLinkUI } from "components/editorComponents/Debugger/DebuggerEntityLink";
import { getIconForEntity } from "@appsmith/components/editorComponents/Debugger/ErrorLogs/getLogIconForEntity";
import type { Plugin } from "api/PluginApi";

const EntityLinkWrapper = styled.div`
  display: flex;
  align-items: center;
  line-height: 14px;
`;

const IconWrapper = styled.span`
  line-height: ${(props) => props.theme.lineHeights[0]}px;
  color: ${Colors.CHARCOAL};
  display: flex;
  align-items: center;

  svg {
    width: 12px;
    height: 12px;
  }
  margin-right: 4px;
`;

// This function is used to fetch the icon component for the entity link.
const getIcon = (props: LogItemProps, pluginGroups: Record<string, Plugin>) => {
  const entityType = props.source?.type;
  let icon = null;
  if (entityType) {
    icon = getIconForEntity[entityType](props, pluginGroups);
  }
  return icon || <img alt="icon" src={undefined} />;
};

// This component is used to render the entity link in the error logs.
export default function LogEntityLink(props: LogItemProps) {
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const plugin = props.iconId ? pluginGroups[props.iconId] : undefined;
  return (
    <div>
      {props.source && (
        <EntityLinkWrapper
          style={{
            display: "flex",
            alignItems: "center",
            lineHeight: "14px",
          }}
        >
          <IconWrapper>{getIcon(props, pluginGroups)}</IconWrapper>
          <EntityLink
            appsmithErrorCode={props.pluginErrorDetails?.appsmithErrorCode}
            errorSubType={props.messages && props.messages[0].message.name}
            errorType={props.logType}
            id={props.source.id}
            message={props.messages && props.messages[0]}
            name={props.source.name}
            plugin={plugin}
            pluginType={props.source.pluginType}
            propertyPath={props.source.propertyPath}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_NAME}
          />
          :
        </EntityLinkWrapper>
      )}
    </div>
  );
}
