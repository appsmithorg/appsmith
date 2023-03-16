import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { keyBy } from "lodash";
import type { LogItemProps } from "../ErrorLogItem";
import { Colors } from "constants/Colors";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import {
  ApiMethodIcon,
  EntityIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { PluginType } from "entities/Action";
import { getPlugins } from "selectors/entitiesSelector";
import EntityLink, { DebuggerLinkUI } from "../../EntityLink";

const EntityLinkWrapper = styled.div`
  display: flex;
  align-items: center;
  line-height: "14px";
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

// This component is used to render the entity link in the error logs.
export default function LogEntityLink(props: LogItemProps) {
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  // This function is used to fetch the icon component for the entity link.
  const getIcon = () => {
    if (props.source) {
      // If the source is a widget.
      if (props.source.type === ENTITY_TYPE.WIDGET && props.source.pluginType) {
        return (
          <WidgetIcon height={16} type={props.source.pluginType} width={16} />
        );
      }
      // If the source is a JS action.
      else if (props.source.type === ENTITY_TYPE.JSACTION) {
        return JsFileIconV2(16, 16);
      } else if (props.source.type === ENTITY_TYPE.ACTION) {
        // If the source is an API action.
        if (
          props.source.pluginType === PluginType.API &&
          props.source.httpMethod
        ) {
          return ApiMethodIcon(props.source.httpMethod, "16px", "32px", 50);
        }
        // If the source is a Datasource action.
        else if (props.iconId && pluginGroups[props.iconId]) {
          return (
            <EntityIcon height={"16px"} width={"16px"}>
              <img
                alt="entityIcon"
                src={pluginGroups[props.iconId].iconLocation}
              />
            </EntityIcon>
          );
        }
      }
    }
    // If the source is not defined then return an empty icon.
    // this case is highly unlikely to happen.
    return <img alt="icon" src={undefined} />;
  };

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
          <IconWrapper>{getIcon()}</IconWrapper>
          <EntityLink
            appsmithErrorCode={props.pluginErrorDetails?.appsmithErrorCode}
            errorSubType={props.messages && props.messages[0].message.name}
            errorType={props.logType}
            id={props.source.id}
            name={props.source.name}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_NAME}
          />
          :
        </EntityLinkWrapper>
      )}
    </div>
  );
}
