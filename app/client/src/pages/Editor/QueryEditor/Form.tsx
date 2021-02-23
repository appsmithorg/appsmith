import { formValueSelector, reduxForm } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Action } from "entities/Action";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
} from "selectors/entitiesSelector";

import { EditorJSONtoForm, EditorJSONtoFormProps } from "./EditorJSONtoForm";

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const responseTypes = getPluginResponseTypes(state);
  const documentationLinks = getPluginDocumentationLinks(state);

  return {
    actionName,
    pluginId,
    responseType: responseTypes[pluginId],
    documentationLink: documentationLinks[pluginId],
    formName: QUERY_EDITOR_FORM_NAME,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Action, EditorJSONtoFormProps>({
    form: QUERY_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(EditorJSONtoForm),
);
