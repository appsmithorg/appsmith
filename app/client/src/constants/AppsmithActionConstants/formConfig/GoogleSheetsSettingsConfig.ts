import {
  RUN_BEHAVIOR,
  RUN_BEHAVIOR_VALUES,
} from "PluginActionEditor/constants/PluginActionConstants";

export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run behavior",
        configProperty: "runBehavior",
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
        label: "API timeout (in milliseconds)",
        subtitle: "Maximum time after which the API will return",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
      },
    ],
  },
];
