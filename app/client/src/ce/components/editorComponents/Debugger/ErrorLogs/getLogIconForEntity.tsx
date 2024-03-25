import React from "react";
import type { LogItemProps } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import { PluginType } from "entities/Action";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import {
  ApiMethodIcon,
  EntityIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

export const getIconForEntity: Record<
  string,
  (props: LogItemProps, pluginImages: Record<string, string>) => any
> = {
  [ENTITY_TYPE.WIDGET]: (props) => {
    if (props.source?.pluginType) {
      return (
        <WidgetIcon height={16} type={props.source.pluginType} width={16} />
      );
    }
  },
  [ENTITY_TYPE.JSACTION]: () => {
    return JsFileIconV2(16, 16, true, true);
  },
  [ENTITY_TYPE.ACTION]: (props, pluginImages) => {
    const { iconId, source } = props;
    if (source?.pluginType === PluginType.API && source.httpMethod) {
      // If the source is an API action.
      return ApiMethodIcon(source.httpMethod, "16px", "32px", 50);
    } else if (iconId && pluginImages[iconId]) {
      // If the source is a Datasource action.
      return (
        <EntityIcon height={"16px"} noBackground noBorder width={"16px"}>
          <img alt="entityIcon" src={getAssetUrl(pluginImages[iconId])} />
        </EntityIcon>
      );
    }
    return <img alt="icon" />;
  },
};
