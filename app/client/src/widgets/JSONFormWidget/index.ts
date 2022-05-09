import IconSVG from "./icon.svg";
import Widget, { JSONFormWidgetProps } from "./widget";
import { ButtonVariantTypes } from "components/constants";
import { BlueprintOperationTypes } from "widgets/constants";

const SUBMIT_BUTTON_DEFAULT_STYLES = {
  buttonVariant: ButtonVariantTypes.PRIMARY,
};

const RESET_BUTTON_DEFAULT_STYLES = {
  buttonVariant: ButtonVariantTypes.SECONDARY,
};

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "JSON Form",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    animateLoading: true,
    backgroundColor: "#fff",
    columns: 25,
    disabledWhenInvalid: true,
    fixedFooter: true,
    rows: 50,
    schema: {},
    scrollContents: true,
    showReset: true,
    title: "Form",
    version: 1,
    widgetName: "JSONForm",
    autoGenerateForm: true,
    fieldLimitExceeded: false,
    sourceData: {
      name: "John",
      date_of_birth: "20/02/1990",
      employee_id: 1001,
    },
    submitButtonLabel: "Submit",
    resetButtonLabel: "Reset",
    blueprint: {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: (widget: JSONFormWidgetProps) => {
            /**
             * As submitButtonStyles are objects, the tend to override the submitButtonStyles
             * present in the defaults so a merge is necessary to incorporate non theme related props.
             */
            return [
              {
                widgetId: widget.widgetId,
                propertyName: "submitButtonStyles",
                propertyValue: {
                  ...widget.submitButtonStyles,
                  ...SUBMIT_BUTTON_DEFAULT_STYLES,
                },
              },
              {
                widgetId: widget.widgetId,
                propertyName: "resetButtonStyles",
                propertyValue: {
                  ...widget.resetButtonStyles,
                  ...RESET_BUTTON_DEFAULT_STYLES,
                },
              },
            ];
          },
        },
      ],
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
