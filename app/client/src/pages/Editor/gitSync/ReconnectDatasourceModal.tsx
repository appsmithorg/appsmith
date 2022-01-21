import React, { useEffect, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import { getOrganizationIdForImport } from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import TabMenu from "./Menu";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import _, { get } from "lodash";
import { Title } from "./components/StyledComponents";
import {
  createMessage,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
} from "constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import {
  getDatasource,
  getDatasources,
  getIsDeletingDatasource,
  getIsReconnectingDatasourcesModalOpen,
  getPlugin,
  getPluginForm,
  getPluginImages,
  getPluginNames,
} from "selectors/entitiesSelector";
import { setIsReconnectingDatasourcesModalOpen } from "actions/metaActions";
import { Datasource } from "entities/Datasource";
import { PluginImage } from "../DataSourceEditor/JSONtoForm";
import DBForm from "../DataSourceEditor/DBForm";
import { initDatasourceConnectionDuringImportRequest } from "actions/applicationActions";
import { debug } from "loglevel";
import { getFetchingDatasourceConfigForImport } from "selectors/applicationSelectors";
import { DatasourcePaneFunctions } from "../DataSourceEditor";
import { AppState } from "reducers";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { getFormValues, submit } from "redux-form";
import {
  deleteDatasource,
  setDatsourceEditorMode,
  switchDatasource,
  testDatasource,
  updateDatasource,
} from "actions/datasourceActions";
import { DatasourceComponentTypes } from "api/PluginApi";
import { ReduxAction } from "constants/ReduxActionConstants";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { connect } from "react-redux";

const Container = styled.div`
  height: 804px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px 10px 0px 0px;
`;

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const BodyContainer = styled.div`
  flex: 3;
  height: calc(100% - ${MENU_HEIGHT}px);
  padding-left: ${(props) => props.theme.spaces[8]}px;
`;

const TabsContainer = styled.div`
  height: ${MENU_HEIGHT}px;
  padding-left: ${(props) => props.theme.spaces[8]}px;
`;

const ContentWrapper = styled.div`
  height: calc(100% - 76px);
  display: flex;
  margin-left: -${(props) => props.theme.spaces[8]}px;
  .t--json-to-form {
    width: 100%;
    .t--close-editor {
      display: none;
    }
  }
`;

const ListContainer = styled.div`
  height: 100%;
  overflow: auto;
  width: 206px;
`;

const ListItem = styled.div`
  display: flex;
  height: 64px;
  width: 100%;
  padding: 10px 18px;
  margin-bottom: 10px;
  cursor: pointer;
  &.active,
  &:hover {
    background-color: ${Colors.GEYSER_LIGHT};
  }
  img {
    width: 24pxx;
    height: 22.5px;
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }
`;

const ListLabels = styled.div`
  display: flex;
  flex-direction: column;
  .t--ds-list-description {
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ButtonContainer = styled.div<{ topMargin: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.topMargin]}px`};
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => props.theme.spaces[5]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

interface ReduxStateProps {
  formData: Datasource;
  isSaving: boolean;
  isTesting: boolean;
  formConfig: any[];
  isDeleting: boolean;
  isNewDatasource: boolean;
  pluginImages: Record<string, string>;
  pluginId: string;
  viewMode: boolean;
  pluginType: string;
  pluginDatasourceForm: string;
  pluginPackageName: string;
  applicationId: string;
}

type DSProps = ReduxStateProps &
  DatasourcePaneFunctions & { datasourceId: string };

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  const newProps = {
    pluginImages: getPluginImages(state),
    formData,
    pluginId,
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    isNewDatasource: datasourcePane.newDatasource === props.datasourceId,
    viewMode: datasourcePane.viewMode[datasource?.id ?? ""] ?? true,
    pluginType: plugin?.type ?? "",
    pluginDatasourceForm:
      plugin?.datasourceComponent ?? DatasourceComponentTypes.AutoForm,
    pluginPackageName: plugin?.packageName ?? "",
    applicationId: "",
  };
  if (datasource) {
    newProps.formData = datasource;
  }
  return newProps;
};

const mapDispatchToProps = (dispatch: any): DatasourcePaneFunctions => ({
  submitForm: (name: string) => dispatch(submit(name)),
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => {
    dispatch(updateDatasource(formData, onSuccess));
  },
  redirectToNewIntegrations: (
    applicationId: string,
    pageId: string,
    params: any,
  ) => undefined,
  testDatasource: (data: Datasource) => dispatch(testDatasource(data)),
  deleteDatasource: (id: string) => dispatch(deleteDatasource({ id })),
  switchDatasource: (id: string) => dispatch(switchDatasource(id)),
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode: false })),
  openOmnibarReadMore: (text: string) => {
    dispatch(setGlobalSearchQuery(text));
    dispatch(toggleShowGlobalSearchModal());
  },
});

const DSForm = connect(
  mapStateToProps,
  mapDispatchToProps,
)((props: DSProps) => {
  const {
    deleteDatasource,
    formConfig,
    formData,
    isDeleting,
    isNewDatasource,
    isSaving,
    isTesting,
    openOmnibarReadMore,
    pluginId,
    pluginImages,
    pluginType,
    setDatasourceEditorMode,
  } = props;

  return (
    <DBForm
      applicationId={""}
      datasourceId={props.datasourceId}
      formConfig={formConfig}
      formData={formData}
      formName={DATASOURCE_DB_FORM}
      handleDelete={deleteDatasource}
      isDeleting={isDeleting}
      isSaving={isSaving}
      isTesting={isTesting}
      onSave={() => undefined}
      onSubmit={() => undefined}
      onTest={props.testDatasource}
      openOmnibarReadMore={openOmnibarReadMore}
      pageId={""}
      pluginImage={pluginImages[pluginId]}
      pluginType={pluginType}
      setDatasourceEditorMode={setDatasourceEditorMode}
      viewMode={!!false}
    />
  );
});

function ReconnectDatasourceModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsReconnectingDatasourcesModalOpen);
  // const organizationId = useSelector(getOrganizationIdForImport);
  const organizationId = "61e539ea33f03a13de18c3d0";
  // todo use for loading state
  const isFetchingDatasourceConfigForImport = useSelector(
    getFetchingDatasourceConfigForImport,
  );

  // todo uncomment this to fetch datasource config
  useEffect(() => {
    if (isModalOpen && organizationId) {
      dispatch(
        initDatasourceConnectionDuringImportRequest(organizationId as string),
      );
    }
  }, [organizationId, isModalOpen]);

  const handleClose = useCallback(() => {
    dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: false }));
  }, [dispatch, setIsReconnectingDatasourcesModalOpen, isModalOpen]);

  const dataSources = useSelector(getDatasources);
  const pluginImages = useSelector(getPluginImages);
  const pluginNames = useSelector(getPluginNames);
  const [
    selectedDatasource,
    setSelectedDatasource,
  ] = useState<Datasource | null>(null);

  useEffect(() => {
    if (!selectedDatasource && dataSources.length) {
      setSelectedDatasource(dataSources[0]);
    }
  }, [selectedDatasource, dataSources]);

  const menuOptions = [
    {
      key: "RECONNECT_DATASOURCES",
      title: "Reconnect Datasources",
    },
  ];

  return (
    <>
      <Dialog
        canEscapeKeyClose
        canOutsideClickClose
        className={Classes.GIT_IMPORT_MODAL}
        isOpen={isModalOpen}
        maxWidth={"1300px"}
        onClose={handleClose}
        width={"1293px"}
      >
        <Container>
          <TabsContainer>
            <TabMenu
              activeTabIndex={0}
              onSelect={() => undefined}
              options={menuOptions}
            />
          </TabsContainer>
          <BodyContainer>
            <Title>
              {createMessage(RECONNECT_MISSING_DATASOURCE_CREDENTIALS)}
            </Title>
            <Section>
              <Text color={Colors.BLACK} type={TextType.P1}>
                {createMessage(
                  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
                )}
              </Text>
            </Section>
            <ContentWrapper>
              <ListContainer>
                {dataSources.map((ds: Datasource) => {
                  return (
                    <ListItem
                      className={`t--ds-list ${
                        ds.id === selectedDatasource?.id ? "active" : ""
                      }`}
                      key={ds.id}
                      onClick={() => setSelectedDatasource(ds)}
                    >
                      <PluginImage
                        alt="Datasource"
                        src={pluginImages[ds.pluginId]}
                      />
                      <ListLabels>
                        <Text
                          color={Colors.GRAY_800}
                          style={{ marginBottom: 2 }}
                          type={TextType.H4}
                        >
                          {pluginNames[ds.pluginId]}
                        </Text>
                        <Text
                          className="t--ds-list-description"
                          color={Colors.GRAY_700}
                          type={TextType.H5}
                        >
                          {ds.name}
                        </Text>
                      </ListLabels>
                    </ListItem>
                  );
                })}
              </ListContainer>
              <DSForm datasourceId={selectedDatasource?.id} />
            </ContentWrapper>
          </BodyContainer>
          <CloseBtnContainer onClick={handleClose}>
            <Icon
              fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
              name="close-modal"
              size={IconSize.XXXXL}
            />
          </CloseBtnContainer>
        </Container>
      </Dialog>
      <GitErrorPopup />
    </>
  );
}

export default ReconnectDatasourceModal;
