import React, { useEffect, useState } from "react";
import styled from "styled-components";
import BlankState from "../components/BlankState";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { getPlugins } from "selectors/entitiesSelector";
import { keyBy } from "lodash";
import { PluginType } from "entities/Action";
import { getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { importSvg } from "design-system-old";
import AddDatasourceModal from "./AddDatasourceModal";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-datasources.svg"),
);

const Container = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  p {
    font-size: 30px;
    color: #4c5664;
  }
`;

const DataMainEmptyState = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const { otherDS } = useAppWideAndOtherDatasource();
  const params = useParams<{ appId: string; dataId?: string }>();
  const plugins = useSelector(getPlugins);
  const pluginByKey = keyBy(plugins, "id");
  useEffect(() => {
    if (params.dataId) {
      setOpenAddModal(false);
    }
  }, [params.dataId]);
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
  const showBlankState = !otherItems.length;

  if (showBlankState) {
    return (
      <>
        <AddDatasourceModal
          isOpen={openAddModal}
          onBack={() => setOpenAddModal(false)}
        />
        <div className="flex items-center h-full justify-center">
          <BlankState
            buttonText="New Datasource"
            description={
              "Experience the power of Appsmith by connecting to your data"
            }
            image={DataIcon}
            onClick={() => setOpenAddModal(true)}
          />
        </div>
      </>
    );
  }
  return (
    <Container>
      <p>Select a datasource</p>
    </Container>
  );
};

export default DataMainEmptyState;
