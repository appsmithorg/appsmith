import { getPlugins } from "ee/selectors/entitiesSelector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Text,
} from "@appsmith/ads";
import type { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import EntityCheckboxSelector from "./EntityCheckboxSelector";

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
  selectedQueries: string[];
  updateSelectedQueries: (queryIds: string[]) => void;
}
const JSObjectsNQueriesExport = ({
  appDS,
  data,
  selectedQueries,
  updateSelectedQueries,
}: Props) => {
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsIDToPluginIDMap: { [key: string]: any } = useMemo(() => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: { [key: string]: any } = {};

    Object.keys(data).forEach((key) => {
      const ds = appDS.find((ds) => ds.name === key);

      if (ds) {
        map[key] = ds.pluginId;
      }
    });

    return map;
  }, [appDS]);

  const onEntitySelected = (id: string, selected: boolean) => {
    const updatedSelectedNodes = [...selectedQueries];

    if (selected) {
      updatedSelectedNodes.push(id);
    } else {
      updatedSelectedNodes.splice(updatedSelectedNodes.indexOf(id), 1);
    }

    updateSelectedQueries(updatedSelectedNodes);
  };

  return (
    <div
      className="pl-4 pr-4"
      data-testid="t--partialExportModal-queriesSection"
    >
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
              onEntityChecked={onEntitySelected}
              selectedIds={selectedQueries}
            />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default JSObjectsNQueriesExport;
