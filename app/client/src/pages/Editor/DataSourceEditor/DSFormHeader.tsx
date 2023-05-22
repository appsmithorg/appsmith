import React, { useState } from "react";
import { Icon, IconSize } from "design-system-old";
import FormTitle from "./FormTitle";
import NewActionButton from "./NewActionButton";
import {
  ActionWrapper,
  EditDatasourceButton,
  FormTitleContainer,
  Header,
  PluginImage,
} from "./JSONtoForm";
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

type DSFormHeaderProps = {
  canCreateDatasourceActions: boolean;
  canDeleteDatasource: boolean;
  canManageDatasource: boolean;
  datasource: Datasource | ApiDatasourceForm | undefined;
  datasourceId: string;
  isDeleting: boolean;
  isNewDatasource: boolean;
  isPluginAuthorized: boolean;
  isSaving: boolean;
  pluginImage: string;
  pluginType: string;
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
    <Header style={{ paddingTop: "20px", flex: "1 1 10%" }}>
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
            }}
          >
            EDIT
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
