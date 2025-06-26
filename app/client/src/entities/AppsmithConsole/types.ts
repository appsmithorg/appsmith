import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { PluginType } from "entities/Plugin";
import type { HTTP_METHOD } from "PluginActionEditor/constants/CommonApiConstants";

export interface SourceEntity {
  type: ENTITY_TYPE;
  // Widget or action name
  name: string;
  // Id of the widget or action
  id: string;
  // property path of the child
  propertyPath?: string;
  // plugin type of the action or type of widget
  pluginType?: PluginType | string;
  // http method of the api. (Only for api actions)
  httpMethod?: HTTP_METHOD;
}
