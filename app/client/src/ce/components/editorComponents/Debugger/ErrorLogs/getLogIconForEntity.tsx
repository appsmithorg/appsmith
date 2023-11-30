import React from "react";
import type { Plugin } from "api/PluginApi";
import type { LogItemProps } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import { PluginType } from "entities/Action";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import {
  ApiMethodIcon,
  EntityIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";

export const getIconForEntity: Record<
  string,
  (props: LogItemProps, pluginGroups: Record<string, Plugin>) => any
> = {
  [ENTITY_TYPE_VALUE.WIDGET]: (props) => {
    if (props.source?.pluginType) {
      return (
        <WidgetIcon height={16} type={props.source.pluginType} width={16} />
      );
    }
  },
  [ENTITY_TYPE_VALUE.JSACTION]: () => {
    return JsFileIconV2(16, 16, true, true);
  },
  [ENTITY_TYPE_VALUE.ACTION]: (props, pluginGroups) => {
    const { iconId, source } = props;
    if (source?.pluginType === PluginType.API && source.httpMethod) {
      // If the source is an API action.
      return ApiMethodIcon(source.httpMethod, "16px", "32px", 50);
    } else if (iconId && pluginGroups[iconId]) {
      // If the source is a Datasource action.
      return (
        <EntityIcon height={"16px"} noBackground noBorder width={"16px"}>
          <img
            alt="entityIcon"
            src={getAssetUrl(pluginGroups[iconId].iconLocation)}
          />
        </EntityIcon>
      );
    }
    return <img alt="icon" />;
  },
};
