/* DO NOT INTRODUCE PAGE AND APPLICATION DEPENDENCIES IN THIS COMPONENT */
import React, { useState } from "react";
import FormTitle from "./FormTitle";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import type { Datasource } from "entities/Datasource";
import {
  CONFIRM_CONTEXT_DELETING,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_DELETE,
  EDIT,
  createMessage,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useDispatch, useSelector } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import { debounce } from "lodash";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { MenuWrapper, StyledMenu } from "components/utils/formComponents";
import styled from "styled-components";
import { Button, MenuContent, MenuItem, MenuTrigger } from "@appsmith/ads";
import { DatasourceEditEntryPoints } from "constants/Datasource";
import {
  DB_NOT_SUPPORTED,
  isEnvironmentConfigured,
} from "ee/utils/Environments";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import type { PluginType } from "entities/Action";
import { useEditorType } from "ee/hooks";
import { useHistory } from "react-router";
import { useHeaderActions } from "ee/hooks/datasourceEditorHooks";

export const ActionWrapper = styled.div`
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  align-items: center;
`;

export const FormTitleContainer = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
`;

export const Header = styled.div<{ noBottomBorder: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  ${(props) =>
    !props.noBottomBorder &&
    "border-bottom: 1px solid var(--ads-v2-color-border);"}
  padding: var(--ads-v2-spaces-5) 0 var(--ads-v2-spaces-5);
  margin: 0 var(--ads-v2-spaces-7);
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PluginImage = (props: any) => {
  return (
    <PluginImageWrapper>
      <img {...props} />
    </PluginImageWrapper>
  );
};

interface DSFormHeaderProps {
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
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => void;
  viewMode: boolean;
  noBottomBorder?: boolean;
}

export const DSFormHeader = (props: DSFormHeaderProps) => {
  const {
    canDeleteDatasource,
    canManageDatasource,
    datasource,
    datasourceId,
    isDeleting,
    isNewDatasource,
    isPluginAuthorized,
    noBottomBorder,
    pluginImage,
    pluginName,
    pluginType,
    setDatasourceViewMode,
    viewMode,
  } = props;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  const editorType = useEditorType(history.location.pathname);

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

  const currentEnv = useSelector(getCurrentEnvironmentId);
  const envSupportedDs = !DB_NOT_SUPPORTED.includes(pluginType as PluginType);

  const showReconnectButton = !(
    isPluginAuthorized &&
    (envSupportedDs
      ? isEnvironmentConfigured(datasource as Datasource, currentEnv)
      : true)
  );

  const headerActions = useHeaderActions(editorType, {
    datasource,
    isPluginAuthorized,
    pluginType,
    showReconnectButton,
  });

  return (
    <Header noBottomBorder={!!noBottomBorder}>
      <FormTitleContainer>
        <PluginImage alt="Datasource" src={getAssetUrl(pluginImage)} />
        <FormTitle
          datasourceId={datasourceId}
          disabled={!isNewDatasource && !canManageDatasource}
          focusOnMount={isNewDatasource}
        />
      </FormTitleContainer>
      {viewMode && (
        <ActionWrapper>
          {canDeleteDatasource && (
            <MenuWrapper
              className="t--datasource-menu-option"
              key={datasourceId}
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
                <MenuContent align="end" style={{ zIndex: 100 }} width="200px">
                  {renderMenuOptions()}
                </MenuContent>
              </StyledMenu>
            </MenuWrapper>
          )}
          <Button
            className="t--edit-datasource"
            kind="secondary"
            onClick={() => {
              setDatasourceViewMode({
                datasourceId: datasourceId,
                viewMode: false,
              });
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
          {headerActions && headerActions.newActionButton
            ? headerActions.newActionButton
            : null}
        </ActionWrapper>
      )}
    </Header>
  );
};
