import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";
import PluginActionSettingsPopover, {
  type SettingsProps,
} from "./SettingsPopover";

export default reduxForm<unknown, SettingsProps>({
  form: API_EDITOR_FORM_NAME,
  enableReinitialize: true,
})(PluginActionSettingsPopover);
