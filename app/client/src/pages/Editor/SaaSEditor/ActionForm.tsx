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

type StateAndRouteProps = EditorJSONtoFormProps & {
  actionObjectDiff?: any;
} & RouteComponentProps<{
    pageId: string;
    pluginPackageName: string;
    apiId: string;
  }>;

type Props = StateAndRouteProps & InjectedFormProps<Action, StateAndRouteProps>;

function ActionForm(props: Props) {
  const {
    actionName,
    match: {
      params: { apiId, pageId },
    },
    pluginId,
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
    formData: getFormValues(SAAS_EDITOR_FORM)(state) as SaaSAction,
    documentationLink: documentationLinks[pluginId],
    initialValues,
    dataSources,
    DATASOURCES_OPTIONS,
    executedQueryData: responses[apiId],
    runErrorMessage: runErrorMessage[apiId],
    formName: SAAS_EDITOR_FORM,
    actionObjectDiff,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Action, StateAndRouteProps>({
    form: SAAS_EDITOR_FORM,
    enableReinitialize: true,
  })(ActionForm),
);
