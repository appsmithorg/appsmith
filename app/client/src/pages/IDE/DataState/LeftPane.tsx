import React, { useEffect, useState } from "react";
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
import { PluginType } from "../../../entities/Action";
import AddDatasourceModal from "./AddDatasourceModal";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";

const DataLeftPane = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const workspace = useSelector(getCurrentAppWorkspace);
  const { appWideDS, otherDS } = useAppWideAndOtherDatasource();
  const params = useParams<{ appId: string; dataId?: string }>();
  const plugins = useSelector(getPlugins);
  const pluginByKey = keyBy(plugins, "id");
  useEffect(() => {
    if (params.dataId) {
      setOpenAddModal(false);
    }
  }, [params.dataId]);
  const items = appWideDS
    .filter((item) => {
      const plugin = pluginByKey[item.pluginId];
      if (plugin) {
        const plugin = pluginByKey[item.pluginId];
        return plugin.type !== PluginType.SAAS;
      }
      return false;
    })
    .map((item) => {
      const plugin = pluginByKey[item.pluginId];
      return {
        key: item.id,
        name: item.name,
        icon: getPluginIcon(plugin),
        selected: item.id === params.dataId,
      };
    });
  const otherItems = otherDS
    .filter((item) => {
      const plugin = pluginByKey[item.pluginId];
      if (plugin) {
        return plugin.type !== PluginType.SAAS;
      }
      return false;
    })
    .map((item) => {
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
      <AddDatasourceModal
        isOpen={openAddModal}
        onBack={() => setOpenAddModal(false)}
      />
      <ListSubTitle title={"Datasources used in this app"} />
      <ListView items={items} onClick={onItemClick} />
      <ListSubTitle
        rightIcon={
          <Button
            isIconButton
            kind="tertiary"
            onClick={() => setOpenAddModal(true)}
            startIcon={"plus"}
          />
        }
        title={`Other datasources in ${workspace.name}`}
      />
      <ListView items={otherItems} onClick={onItemClick} />
    </div>
  );
};

export default DataLeftPane;
