import type { DefaultPlugin, Plugin } from "api/PluginApi.types";
import type {
  PluginFormPayloadWithId,
  PluginFormsPayload,
  GetPluginFormConfigRequest,
} from "actions/pluginActions";
import type {
  FormEditorConfigs,
  FormSettingsConfigs,
  FormDependencyConfigs,
  FormDatasourceButtonConfigs,
} from "utils/DynamicBindingUtils";

export interface PluginDataState {
  list: Plugin[];
  defaultPluginList: DefaultPlugin[];
  loading: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formConfigs: Record<string, any[]>;
  editorConfigs: FormEditorConfigs;
  settingConfigs: FormSettingsConfigs;
  dependencies: FormDependencyConfigs;
  datasourceFormButtonConfigs: FormDatasourceButtonConfigs;
  fetchingSinglePluginForm: Record<string, boolean>;
  fetchingDefaultPlugins: boolean;
}
