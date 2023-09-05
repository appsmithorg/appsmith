import React from "react";
import { isDatasourceInViewMode } from "../../../selectors/ui";
import { useSelector } from "react-redux";
import type { Datasource } from "../../../entities/Datasource";
import { get } from "lodash";
import { Modal, ModalContent, Text } from "design-system";
import { PluginImage } from "../../Editor/DataSourceEditor/DSFormHeader";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { getPluginImages } from "../../../selectors/entitiesSelector";
import { getCurrentApplicationId } from "../../../selectors/editorSelectors";
import type { ApiDatasourceForm } from "../../../entities/Datasource/RestAPIForm";
import DatasourceForm from "./DBForm";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import styled from "styled-components";

type Props = {
  datasource: Datasource | ApiDatasourceForm;
};

const getDatasourceId = (
  datasource: ApiDatasourceForm | Datasource,
): string => {
  if ("id" in datasource) {
    return datasource.id;
  }
  return datasource.datasourceId;
};

const WorkspaceTitle = styled.span`
  color: #6a7585;
  font-size: 11px;
  font-weight: 400;
  line-height: 15px;
`;

const EditDatasourceModal = (props: Props) => {
  const { datasource } = props;
  const viewMode = useSelector(isDatasourceInViewMode);
  const workspace = useSelector(getCurrentAppWorkspace);
  const datasourceId = getDatasourceId(datasource);
  const pluginId = get(datasource, "pluginId", "");
  const pluginImage = useSelector(getPluginImages)[pluginId];
  const applicationId = useSelector(getCurrentApplicationId);
  return (
    <Modal open={!viewMode}>
      <ModalContent style={{ width: "65vw" }}>
        <div className="flex align-center justify-between py-3">
          <div>
            <WorkspaceTitle>{workspace.name} &bull; Datasources</WorkspaceTitle>
            <div className="flex flex-row mt-1.5">
              <PluginImage alt="Datasource" src={getAssetUrl(pluginImage)} />
              <Text kind="heading-m">{props.datasource.name}</Text>
            </div>
          </div>
        </div>
        <DatasourceForm
          applicationId={applicationId}
          datasourceId={datasourceId}
        />
      </ModalContent>
    </Modal>
  );
};

export default EditDatasourceModal;
