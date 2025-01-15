import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { Action } from "entities/Action";
import { reduxForm } from "redux-form";
import {
  PluginDatasourceSelector,
  type CustomProps,
} from "./PluginDatasourceSelector";

export default reduxForm<Action, CustomProps>({
  form: API_EDITOR_FORM_NAME,
  destroyOnUnmount: false,
  enableReinitialize: true,
})(PluginDatasourceSelector);
