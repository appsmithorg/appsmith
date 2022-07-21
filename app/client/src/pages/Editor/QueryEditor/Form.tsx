import { formValueSelector, reduxForm } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Action } from "entities/Action";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
  getPlugin,
  getActionData,
} from "selectors/entitiesSelector";
import { EditorJSONtoForm, EditorJSONtoFormProps } from "./EditorJSONtoForm";
import { getFormEvaluationState } from "selectors/formSelectors";

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState, props: any) => {
  const actionId = valueSelector(state, "id");
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const selectedDbId = valueSelector(state, "datasource.id");
  const actionData = getActionData(state, actionId);
  let responseDisplayFormat: { title: string; value: string };
  let responseDataTypes: { key: string; title: string }[];
  if (actionData && actionData.responseDisplayFormat) {
    responseDataTypes = actionData.dataTypes.map((data) => {
      return {
        key: data.dataType,
        title: data.dataType,
      };
    });
    responseDisplayFormat = {
      title: actionData.responseDisplayFormat,
      value: actionData.responseDisplayFormat,
    };
  } else {
    responseDataTypes = [];
    responseDisplayFormat = {
      title: "",
      value: "",
    };
  }

  const responseTypes = getPluginResponseTypes(state);
  const documentationLinks = getPluginDocumentationLinks(state);
  const plugin = getPlugin(state, pluginId);
  // State to manage the evaluations for the form
  let formEvaluationState = {};

  // Fetching evaluations state only once the formData is populated
  if (!!props.formData) {
    formEvaluationState = getFormEvaluationState(state)[props.formData.id];
  }

  return {
    actionName,
    plugin,
    pluginId,
    selectedDbId,
    responseDataTypes,
    responseDisplayFormat,
    responseType: responseTypes[pluginId],
    documentationLink: documentationLinks[pluginId],
    formName: QUERY_EDITOR_FORM_NAME,
    formEvaluationState,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Action, EditorJSONtoFormProps>({
    form: QUERY_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(EditorJSONtoForm),
);
