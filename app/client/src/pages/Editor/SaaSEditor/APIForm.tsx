import React, { useEffect } from "react";
import { getFormValues, InjectedFormProps, reduxForm } from "redux-form";
import history from "utils/history";
import { SAAS_EDITOR_URL } from "pages/Editor/SaaSEditor/constants";
import { SAAS_EDITOR_FORM } from "constants/forms";
import { Action, SaaSAction } from "entities/Action";
import { connect, useDispatch } from "react-redux";
import { AppState } from "reducers";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
  getAction,
  getPluginImages,
  getDatasourceByPluginId,
  getActionResponses,
  getPlugin,
} from "selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";
import { saasActionSettingsConfig } from "mockResponses/ActionSettings";
import { RouteComponentProps } from "react-router";
import { deleteAction, runActionInit } from "actions/actionActions";
import { fetchPluginForm } from "actions/pluginActions";
import {
  EditorJSONtoForm,
  EditorJSONtoFormProps,
} from "../QueryEditor/EditorJSONtoForm";
import { Datasource } from "entities/Datasource";
import { getConfigInitialValues } from "components/formControls/utils";
import { merge } from "lodash";

type StateAndRouteProps = EditorJSONtoFormProps &
  RouteComponentProps<{
    applicationId: string;
    pageId: string;
    pluginPackageName: string;
    apiId: string;
  }> & { plugin?: Plugin };

type Props = StateAndRouteProps & InjectedFormProps<Action, StateAndRouteProps>;

const QueryEditorForm: React.FC<Props> = (props: Props) => {
  const {
    match: {
      params: { pageId, applicationId, apiId },
    },
    actionName,
    plugin,
    pluginId,
  } = props;

  const dispatch = useDispatch();
  const onDeleteClick = () => {
    dispatch(deleteAction({ id: apiId, name: actionName }));
  };

  const onRunClick = () => {
    dispatch(runActionInit(apiId));
  };
  const onCreateDatasourceClick = () => {
    history.push(SAAS_EDITOR_URL(applicationId, pageId, plugin?.packageName));
  };

  useEffect(() => {
    if (!pluginId) return;
    dispatch(fetchPluginForm({ id: pluginId }));
  }, [pluginId]);

  const childProps: any = {
    ...props,
    onRunClick,
    onDeleteClick,
    onCreateDatasourceClick,
  };
  return <EditorJSONtoForm {...childProps} />;
};

const mapStateToProps = (state: AppState, props: any) => {
  const { apiId } = props.match.params;
  const { runErrorMessage } = state.ui.queryPane;
  const { plugins } = state.entities;
  const { editorConfigs, settingConfigs, loadingFormConfigs } = plugins;
  const pluginImages = getPluginImages(state);

  const action = getAction(state, apiId);
  const actionName = action?.name ?? "";
  const pluginId = action?.pluginId ?? "";
  const plugin = getPlugin(state, pluginId);
  const responseTypes = getPluginResponseTypes(state);
  const documentationLinks = getPluginDocumentationLinks(state);
  let editorConfig: any;
  const initialValues = {};
  if (editorConfigs && pluginId) {
    editorConfig = editorConfigs[pluginId];
    if (editorConfig) {
      merge(initialValues, getConfigInitialValues(editorConfig));
    }
  }
  let settingConfig: any;

  if (settingConfigs && pluginId) {
    settingConfig = settingConfigs[pluginId];
  }

  if (!settingConfig) {
    settingConfig = saasActionSettingsConfig;
  }
  merge(initialValues, getConfigInitialValues(settingConfig));
  merge(initialValues, action);

  const dataSources = getDatasourceByPluginId(state, pluginId);
  const DATASOURCES_OPTIONS = dataSources.map((dataSource: Datasource) => ({
    label: dataSource.name,
    value: dataSource.id,
    image: pluginImages[dataSource.pluginId],
  }));

  const responses = getActionResponses(state);
  return {
    isRunning: state.ui.queryPane.isRunning[apiId],
    isDeleting: state.ui.queryPane.isDeleting[apiId],
    loadingFormConfigs,
    editorConfig,
    settingConfig,
    actionName,
    pluginId,
    plugin,
    responseType: responseTypes[pluginId],
    formData: getFormValues(SAAS_EDITOR_FORM)(state) as SaaSAction,
    documentationLink: documentationLinks[pluginId],
    initialValues,
    dataSources,
    DATASOURCES_OPTIONS,
    executedQueryData: responses[apiId],
    runErrorMessage: runErrorMessage[apiId],
    formName: SAAS_EDITOR_FORM,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Action, StateAndRouteProps>({
    form: SAAS_EDITOR_FORM,
    enableReinitialize: true,
  })(QueryEditorForm),
);
