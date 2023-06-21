import React, { useState } from "react";
import FormTitle from "./FormTitle";
import NewActionButton from "./NewActionButton";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { Datasource } from "entities/Datasource";
import {
  CONFIRM_CONTEXT_DELETING,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_DELETE,
  EDIT,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDispatch } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import { debounce } from "lodash";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { MenuWrapper, StyledMenu } from "components/utils/formComponents";
import styled from "styled-components";
import { Button, MenuContent, MenuItem, MenuTrigger } from "design-system";
import { DatasourceEditEntryPoints } from "constants/Datasource";

export const ActionWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

export const FormTitleContainer = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-7) 0 var(--ads-v2-spaces-7);
  margin: 0 var(--ads-v2-spaces-7);
  height: 120px;
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
      <MenuItem
        className="t--datasource-option-delete error-menuitem"
        disabled={isDeleting}
        key={"delete-datasource-button"}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onSelect={(e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isDeleting) {
            confirmDelete ? deleteAction() : setConfirmDelete(true);
          }
        }}
        startIcon="delete-bin-line"
      >
        {isDeleting
          ? createMessage(CONFIRM_CONTEXT_DELETING)
          : confirmDelete
          ? createMessage(CONFIRM_CONTEXT_DELETE)
          : createMessage(CONTEXT_DELETE)}
      </MenuItem>,
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
            <MenuWrapper
              className="t--datasource-menu-option"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <StyledMenu onOpenChange={onCloseMenu}>
                <MenuTrigger>
                  <Button
                    data-testid="t--context-menu-trigger"
                    isIconButton
                    kind="tertiary"
                    size="md"
                    startIcon="context-menu"
                  />
                </MenuTrigger>
                <MenuContent style={{ zIndex: 100 }} width="200px">
                  {renderMenuOptions()}
                </MenuContent>
              </StyledMenu>
            </MenuWrapper>
          )}
          <Button
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
            size="md"
          >
            {createMessage(EDIT)}
          </Button>
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
