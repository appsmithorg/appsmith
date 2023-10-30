import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Text,
} from "design-system";
import React, { useMemo } from "react";
import EntityCheckboxSelector from "./EntityCheckboxSelector";
import { getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import type { Datasource } from "entities/Datasource";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import { keyBy } from "lodash";
import { useSelector } from "react-redux";

interface Props {
  appDS: Datasource[];
  data: Record<
    string,
    {
      type: string;
      group: string;
      entity: {
        id: string;
        name: string;
      };
    }[]
  >;
}
const JSObjectsNQueriesExport = ({ appDS, data }: Props) => {
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const dsIDToPluginIDMap: { [key: string]: any } = useMemo(() => {
    const map: { [key: string]: any } = {};
    Object.keys(data).forEach((key) => {
      const ds = appDS.find((ds) => ds.name === key);
      if (ds) {
        map[key] = ds.pluginId;
      }
    });
    return map;
  }, [appDS]);

  return (
    <div className="pl-4 pr-4">
      {Object.keys(data).map((dsName) => (
        <Collapsible isOpen key={dsName}>
          <CollapsibleHeader>
            <Text
              kind="heading-s"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {getPluginIcon(pluginGroups[dsIDToPluginIDMap[dsName]])} {dsName}
            </Text>
          </CollapsibleHeader>
          <CollapsibleContent>
            <EntityCheckboxSelector
              entities={data[dsName].map((item) => item.entity)}
            />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default JSObjectsNQueriesExport;
