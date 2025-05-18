import {
  RUN_BEHAVIOR_VALUES,
  RUN_BEHAVIOR_CONFIG_PROPERTY,
} from "constants/AppsmithActionConstants/formConfig/PluginSettings";
import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";

export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run behavior",
        configProperty: RUN_BEHAVIOR_CONFIG_PROPERTY,
        controlType: "DROP_DOWN",
        initialValue: ActionRunBehaviour.MANUAL,
        options: RUN_BEHAVIOR_VALUES,
      },
      {
        label: "Request confirmation before running this query",
        configProperty: "confirmBeforeExecute",
        controlType: "SWITCH",
        tooltipText:
          "Ask confirmation from the user each time before refreshing data",
      },
      {
        label: "Query timeout (in milliseconds)",
        subtitle: "Maximum time after which the query will return",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
      },
    ],
  },
];
