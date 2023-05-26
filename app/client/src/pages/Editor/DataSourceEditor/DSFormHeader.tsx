import React, { useState } from "react";
import { Icon, IconSize } from "design-system-old";
import FormTitle from "./FormTitle";
import NewActionButton from "./NewActionButton";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { Position } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import type { Datasource } from "entities/Datasource";
import {
  CONFIRM_CONTEXT_DELETING,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_DELETE,
} from "ce/constants/messages";
import { createMessage } from "design-system-old/build/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDispatch } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import { debounce } from "lodash";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { MenuComponent, RedMenuItem } from "components/utils/formComponents";
import styled from "styled-components";
import { Button } from "design-system";
import { EDIT } from "ce/constants/messages";
import { DatasourceEditEntryPoints } from "constants/Datasource";

export const ActionWrapper = styled.div`
  display: flex;
  gap: 16px;
`;

export const FormTitleContainer = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  flex: "1 1 10%";
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-7) 0 var(--ads-v2-spaces-7);
  margin: 0 var(--ads-v2-spaces-7);
`;

export const EditDatasourceButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

export const PluginImageWrapper = styled.div`
  height: 34px;
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
  img {
    height: 34px;
    width: auto;
  }
`;

export const PluginImage = (props: any) => {
  return (
    <PluginImageWrapper>
      <img {...props} />
    </PluginImageWrapper>
  );
};

type DSFormHeaderProps = {
  canCreateDatasourceActions: boolean;
  canDeleteDatasource: boolean;
  canManageDatasource: boolean;
  datasource: Datasource | ApiDatasourceForm | undefined;
  datasourceId: string;
  isDeleting: boolean;
  isNewDatasource: boolean;
  isPluginAuthorized: boolean;
  pluginImage: string;
  pluginType: string;
  pluginName: string;
  setDatasourceViewMode: (viewMode: boolean) => void;
  viewMode: boolean;
};

export const DSFormHeader = (props: DSFormHeaderProps) => {
  const {
    canCreateDatasourceActions,
    canDeleteDatasource,
    canManageDatasource,
    datasource,
    datasourceId,
    isDeleting,
    isNewDatasource,
    isPluginAuthorized,
    pluginImage,
    pluginName,
    pluginType,
    setDatasourceViewMode,
    viewMode,
  } = props;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();

  const deleteAction = () => {
    if (isDeleting) return;
    AnalyticsUtil.logEvent("DATASOURCE_CARD_DELETE_ACTION");
    dispatch(deleteDatasource({ id: datasourceId }));
  };

  const onCloseMenu = debounce(() => setConfirmDelete(false), 20);

  const renderMenuOptions = () => {
    return [
      <RedMenuItem
        className="t--datasource-option-delete"
        icon="delete"
        isLoading={isDeleting}
        key={"delete-datasource-button"}
        onSelect={() => {
          if (!isDeleting) {
            confirmDelete ? deleteAction() : setConfirmDelete(true);
          }
        }}
        text={
          isDeleting
            ? createMessage(CONFIRM_CONTEXT_DELETING)
            : confirmDelete
            ? createMessage(CONFIRM_CONTEXT_DELETE)
            : createMessage(CONTEXT_DELETE)
        }
      />,
    ];
  };

  return (
    <Header>
      <FormTitleContainer>
        <PluginImage alt="Datasource" src={getAssetUrl(pluginImage)} />
        <FormTitle
          disabled={!isNewDatasource && !canManageDatasource}
          focusOnMount={isNewDatasource}
        />
      </FormTitleContainer>
      {viewMode && (
        <ActionWrapper>
          {canDeleteDatasource && (
            <MenuComponent
              menuItemWrapperWidth="160px"
              onClose={onCloseMenu}
              position={Position.LEFT}
              target={
                <Icon
                  fillColor={Colors.GRAY2}
                  name="context-menu"
                  size={IconSize.XXXL}
                />
              }
            >
              {renderMenuOptions()}
            </MenuComponent>
          )}
          <EditDatasourceButton
            className="t--edit-datasource"
            kind="secondary"
            onClick={() => {
              setDatasourceViewMode(false);
              AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
                datasourceId: datasourceId,
                pluginName,
                entryPoint: DatasourceEditEntryPoints.DATASOURCE_FORM_EDIT,
              });
            }}
          >
            {createMessage(EDIT)}
          </EditDatasourceButton>
          <NewActionButton
            datasource={datasource as Datasource}
            disabled={!canCreateDatasourceActions || !isPluginAuthorized}
            eventFrom="datasource-pane"
            pluginType={pluginType}
          />
        </ActionWrapper>
      )}
    </Header>
  );
};
