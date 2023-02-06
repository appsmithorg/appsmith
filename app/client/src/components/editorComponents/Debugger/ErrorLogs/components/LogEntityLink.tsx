import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { keyBy } from "lodash";
import { LogItemProps } from "../ErrorLogItem";
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

export default function LogEntityLink(props: LogItemProps) {
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const getIcon = () => {
    if (props.source) {
      if (props.source.type === ENTITY_TYPE.WIDGET && props.source.pluginType) {
        return (
          <WidgetIcon height={12} type={props.source.pluginType} width={12} />
        );
      } else if (props.source.type === ENTITY_TYPE.JSACTION) {
        return JsFileIconV2(12, 12);
      } else if (props.source.type === ENTITY_TYPE.ACTION) {
        if (
          props.source.pluginType === PluginType.API &&
          props.source.httpMethod
        ) {
          return ApiMethodIcon(props.source.httpMethod, "9px", "17px", 28);
        } else if (props.iconId && pluginGroups[props.iconId]) {
          return (
            <EntityIcon height={"12px"} width={"12px"}>
              <img
                alt="entityIcon"
                src={pluginGroups[props.iconId].iconLocation}
              />
            </EntityIcon>
          );
        }
      }
    }
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
