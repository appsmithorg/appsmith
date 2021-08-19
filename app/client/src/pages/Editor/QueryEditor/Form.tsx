import { formValueSelector, reduxForm } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Action } from "entities/Action";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
  getPlugin,
} from "selectors/entitiesSelector";
import { EditorJSONtoForm, EditorJSONtoFormProps } from "./EditorJSONtoForm";
import { getFormValues } from "redux-form";
import { QueryAction } from "entities/Action";

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const selectedDbId = valueSelector(state, "datasource.id");

  const responseTypes = getPluginResponseTypes(state);
  const documentationLinks = getPluginDocumentationLinks(state);
  const formData = getFormValues(QUERY_EDITOR_FORM_NAME)(state) as QueryAction;

  const plugin = getPlugin(state, pluginId);

  return {
    actionName,
    plugin,
    pluginId,
    selectedDbId,
    responseType: responseTypes[pluginId],
    documentationLink: documentationLinks[pluginId],
    formName: QUERY_EDITOR_FORM_NAME,
    formData: formData,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Action, EditorJSONtoFormProps>({
    form: QUERY_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(EditorJSONtoForm),
);
