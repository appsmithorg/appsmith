import React, { useEffect } from "react";
import { getFormValues, InjectedFormProps, reduxForm } from "redux-form";
import history from "utils/history";
import { SAAS_EDITOR_FORM } from "constants/forms";
import { Action, SaaSAction } from "entities/Action";
import { connect, useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
  getAction,
  getPluginImages,
  getDatasourceByPluginId,
  getActionResponses,
  getPlugin,
  getPlugins,
} from "selectors/entitiesSelector";
import { RouteComponentProps } from "react-router";
import {
  deleteAction,
  runAction,
  setActionProperty,
} from "actions/pluginActionActions";
import {
  EditorJSONtoForm,
  EditorJSONtoFormProps,
} from "../QueryEditor/EditorJSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import { merge } from "lodash";
import { Datasource } from "entities/Datasource";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import { diff, Diff } from "deep-diff";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateReplayEntity } from "actions/pageActions";
import { getPathAndValueFromActionDiffObject } from "../../../utils/getPathAndValueFromActionDiffObject";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import {
  getUIComponent,
  getFormEvaluationState,
} from "selectors/formSelectors";
import { UIComponentTypes } from "api/PluginApi";
import {
  initFormEvaluations,
  startFormEvaluations,
} from "actions/evaluationActions";
import { QueryActionConfig } from "entities/Action";
import { changeQuery } from "actions/queryPaneActions";

type StateAndRouteProps = EditorJSONtoFormProps & {
  actionObjectDiff?: any;
} & RouteComponentProps<{
    pageId: string;
    pluginPackageName: string;
    apiId: string;
  }> &
  ReduxDispatchProps;

type ReduxDispatchProps = {
  changeQueryPage: (queryId: string) => void;
  runFormEvaluation: (formId: string, formData: QueryActionConfig) => void;
  initFormEvaluation: (
    editorConfig: any,
    settingConfig: any,
    formId: string,
  ) => void;
};

type Props = StateAndRouteProps & InjectedFormProps<Action, StateAndRouteProps>;

function ActionForm(props: Props) {
  const {
    actionName,
    changeQueryPage,
    editorConfig,
    formData,
    initFormEvaluation,
    match: {
      params: { apiId, pageId },
    },
    pluginId,
    runFormEvaluation,
    settingConfig,
    uiComponent,
  } = props;

  const dispatch = useDispatch();
  const onDeleteClick = () => {
    dispatch(deleteAction({ id: apiId, name: actionName }));
  };

  useEffect(() => {
    dispatch(
      updateReplayEntity(
        props.initialValues.id as string,
        props.initialValues,
        ENTITY_TYPE.ACTION,
      ),
    );
  }, []);

  useEffect(() => {
    // run evaluations once the component has been mounted.
    initFormEvaluation(editorConfig, settingConfig, apiId);

    changeQueryPage(apiId);
  }, []);

  useEffect(() => {
    // if the formData changes run form evaluations again, to capture the changes.
    if (
      uiComponent === UIComponentTypes.UQIDbEditorForm &&
      formData &&
      formData.id &&
      formData.actionConfiguration
    ) {
      runFormEvaluation(formData.id, formData.actionConfiguration);
    }
  }, [formData]);

  useEffect(() => {
    changeQueryPage(apiId);
  }, [apiId, pluginId]);

  const applicationId = useSelector(getCurrentApplicationId);

  const { path = "", value = "" } = {
    ...getPathAndValueFromActionDiffObject(props.actionObjectDiff),
  };
  if (value && path) {
    dispatch(
      setActionProperty({
        actionId: apiId,
        propertyName: path,
        value: value,
      }),
    );
  }

  const onRunClick = () => {
    dispatch(runAction(apiId));
  };

  const onCreateDatasourceClick = () => {
    history.push(
      INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
    );
  };

  // custom function to return user to integrations page if action is not found
  const goToDatasourcePage = () =>
    history.push(
      INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.ACTIVE),
    );

  // if the action can not be found, generate a entity not found page
  if (!pluginId && apiId) {
    return <EntityNotFoundPane goBackFn={goToDatasourcePage} />;
  }

  const childProps: any = {
    ...props,
    onRunClick,
    onDeleteClick,
    onCreateDatasourceClick,
  };
  return <EditorJSONtoForm {...childProps} />;
}

const mapStateToProps = (state: AppState, props: any) => {
  const { apiId } = props.match.params;
  const { runErrorMessage } = state.ui.queryPane;
  const currentPageId = state.ui.editor.currentPageId;
  const { plugins } = state.entities;
  const { editorConfigs, settingConfigs } = plugins;
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
  merge(initialValues, getConfigInitialValues(settingConfig));
  merge(initialValues, action);
  // initialValues contains merge of action, editorConfig, settingsConfig and will be passed to redux form
  // getting diff between action and initialValues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const actionObjectDiff: undefined | Diff<Action | undefined, Action>[] = diff(
    action,
    initialValues,
  );

  const dataSources = getDatasourceByPluginId(state, pluginId);
  const DATASOURCES_OPTIONS = dataSources.map((dataSource: Datasource) => ({
    label: dataSource.name,
    value: dataSource.id,
    image: pluginImages[dataSource.pluginId],
  }));

  const allPlugins = getPlugins(state);
  let uiComponent = UIComponentTypes.DbEditorForm;
  if (!!pluginId) uiComponent = getUIComponent(pluginId, allPlugins);

  // formData is needed to run form evaluations on the action.
  const formData = getFormValues(SAAS_EDITOR_FORM)(state) as SaaSAction;

  // State to manage the evaluations for the form
  let formEvaluationState = {};
  // Fetching evaluations state only once the formData is populated
  if (!!formData) {
    formEvaluationState = getFormEvaluationState(state)[formData.id];
  }

  const responses = getActionResponses(state);
  return {
    isRunning: state.ui.queryPane.isRunning[apiId],
    isDeleting: state.ui.queryPane.isDeleting[apiId],
    editorConfig,
    settingConfig,
    actionName,
    currentPageId,
    pluginId,
    plugin,
    responseType: responseTypes[pluginId],
    formData,
    formEvaluationState,
    documentationLink: documentationLinks[pluginId],
    initialValues,
    dataSources,
    DATASOURCES_OPTIONS,
    executedQueryData: responses[apiId],
    runErrorMessage: runErrorMessage[apiId],
    formName: SAAS_EDITOR_FORM,
    actionObjectDiff,
    uiComponent,
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  // re using this logic for switching query pane
  changeQueryPage: (apiId: string) => {
    dispatch(changeQuery(apiId));
  },
  runFormEvaluation: (formId: string, formData: QueryActionConfig) => {
    dispatch(startFormEvaluations(formId, formData));
  },
  initFormEvaluation: (
    editorConfig: any,
    settingsConfig: any,
    formId: string,
  ) => {
    dispatch(initFormEvaluations(editorConfig, settingsConfig, formId));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Action, StateAndRouteProps>({
    form: SAAS_EDITOR_FORM,
    enableReinitialize: true,
  })(ActionForm),
);
