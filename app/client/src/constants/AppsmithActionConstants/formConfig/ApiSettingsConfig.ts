import {
  HTTP_PROTOCOL_INPUT_PLACEHOLDER,
  createMessage,
} from "ee/constants/messages";
import {
  HTTP_PROTOCOL,
  HTTP_PROTOCOL_VERSIONS,
} from "PluginActionEditor/constants/CommonApiConstants";
import {
  RUN_BEHAVIOR,
  RUN_BEHAVIOR_VALUES,
} from "PluginActionEditor/types/PluginActionTypes";

export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run behavior",
        configProperty: "runBehaviour",
        controlType: "DROP_DOWN",
        initialValue: RUN_BEHAVIOR.MANUAL.label,
        options: RUN_BEHAVIOR_VALUES,
      },
      {
        label: "Request confirmation before running this API",
        configProperty: "confirmBeforeExecute",
        controlType: "SWITCH",
        tooltipText:
          "Ask confirmation from the user each time before refreshing data",
      },
      {
        label: "Encode query params",
        configProperty: "actionConfiguration.encodeParamsToggle",
        controlType: "SWITCH",
        tooltipText:
          "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded",
      },
      {
        label: "Smart JSON substitution",
        configProperty: "actionConfiguration.pluginSpecifiedTemplates[0].value",
        controlType: "SWITCH",
        tooltipText:
          "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
        initialValue: true,
      },
      {
        label: "Protocol",
        configProperty: "actionConfiguration.httpVersion",
        name: "actionConfiguration.httpVersion",
        controlType: "DROP_DOWN",
        initialValue: HTTP_PROTOCOL.HTTP11.label,
        options: HTTP_PROTOCOL_VERSIONS,
        placeholder: createMessage(HTTP_PROTOCOL_INPUT_PLACEHOLDER),
      },
      {
        label: "API timeout (in milliseconds)",
        subtitle: "Maximum time after which the API will return",
        controlType: "INPUT_TEXT",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        dataType: "NUMBER",
      },
    ],
  },
];
