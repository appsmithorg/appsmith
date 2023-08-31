import React from "react";
import ListView from "../components/ListView";
import { useAppWideAndOtherDatasource } from "../../Editor/Explorer/hooks";
import { getPluginIcon } from "../../Editor/Explorer/ExplorerIcons";
import { getPlugins } from "../../../selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { keyBy } from "lodash";
import history from "../../../utils/history";
import { datasourcesEditorIdURL } from "RouteBuilder";
import { useParams } from "react-router";
import ListSubTitle from "../components/ListSubTitle";
import { Button } from "design-system";

const DataLeftPane = () => {
  const { appWideDS } = useAppWideAndOtherDatasource();
  const params = useParams<{ appId: string; dataId?: string }>();
  const plugins = useSelector(getPlugins);
  const pluginByKey = keyBy(plugins, "id");
  const items = appWideDS.map((item) => {
    const plugin = pluginByKey[item.pluginId];
    return {
      key: item.id,
      name: item.name,
      icon: getPluginIcon(plugin),
      selected: item.id === params.dataId,
    };
  });
  const onItemClick = (item: any) => {
    history.push(
      datasourcesEditorIdURL({
        datasourceId: item.key,
        pageId: "test",
        appId: params.appId,
      }),
    );
  };
  return (
    <div>
      <ListSubTitle
        rightIcon={<Button isIconButton kind="tertiary" startIcon={"plus"} />}
        title={"Active Datasources"}
      />
      <ListView items={items} onClick={onItemClick} />
    </div>
  );
};

export default DataLeftPane;
