import { formValueSelector, reduxForm } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { Action } from "entities/Action";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
  getPlugin,
  getActionData,
} from "ee/selectors/entitiesSelector";
import type { EditorJSONtoFormProps } from "./EditorJSONtoForm";
import { EditorJSONtoForm } from "./EditorJSONtoForm";
import { getFormEvaluationState } from "selectors/formSelectors";
import { actionResponseDisplayDataFormats } from "../utils";

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, props: any) => {
  const actionId = valueSelector(state, "id");
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const selectedDbId = valueSelector(state, "datasource.id");
  const actionData = getActionData(state, actionId);
  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionData);

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
