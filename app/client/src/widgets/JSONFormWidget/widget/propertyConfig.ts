import { Alignment } from "@blueprintjs/core";
import { ButtonPlacementTypes, ButtonVariantTypes } from "components/constants";
import type { OnButtonClickProps } from "components/propertyControls/ButtonControl";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import type { ButtonWidgetProps } from "widgets/ButtonWidget/widget";
import type { JSONFormWidgetProps } from ".";
import { FieldType, MAX_ALLOWED_FIELDS, ROOT_SCHEMA_KEY } from "../constants";
import { ComputedSchemaStatus, computeSchema } from "./helper";
import generatePanelPropertyConfig from "./propertyConfig/generatePanelPropertyConfig";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import {
  JSON_FORM_CONNECT_BUTTON_TEXT,
  SUCCESSFULL_BINDING_MESSAGE,
} from "../constants/messages";
import { createMessage } from "ee/constants/messages";
import { FieldOptionsType } from "components/editorComponents/WidgetQueryGeneratorForm/WidgetSpecificControls/OtherFields/Field/Dropdown/types";
import { DROPDOWN_VARIANT } from "components/editorComponents/WidgetQueryGeneratorForm/CommonControls/DatasourceDropdown/types";

const MAX_NESTING_LEVEL = 5;

const panelConfig = generatePanelPropertyConfig(MAX_NESTING_LEVEL);

export const sourceDataValidationFn = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  props: JSONFormWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _?: any,
): ValidationResponse => {
  if (value === "") {
    return {
      isValid: true,
      parsed: value,
    };
  }

  if (value === null || value === undefined) {
    return {
      isValid: false,
      parsed: value,
      messages: [
        {
          name: "ValidationError",
          message: `Data is undefined`,
        },
      ],
    };
  }

  if (_.isObject(value) && Object.keys(value).length === 0) {
    return {
      isValid: false,
      parsed: value,
      messages: [
        {
          name: "ValidationError",
          message: "Data is empty",
        },
      ],
    };
  }

  if (_.isNumber(value) || _.isBoolean(value)) {
    return {
      isValid: false,
      parsed: {},
      messages: [
        {
          name: "ValidationError",
          message: `Source data cannot be ${value}`,
        },
      ],
    };
  }

  if (_.isNil(value)) {
    return {
      isValid: true,
      parsed: {},
    };
  }

  if (_.isArray(value)) {
    return {
      isValid: false,
      parsed: {},
      messages: [
        {
          name: "TypeError",
          message: `The value does not evaluate to type Object`,
        },
      ],
    };
  }

  if (_.isPlainObject(value)) {
    return {
      isValid: true,
      parsed: value,
    };
  }

  try {
    return {
      isValid: true,
      parsed: JSON.parse(value as string),
    };
  } catch (e) {
    return {
      isValid: false,
      parsed: {},
      messages: [e as Error],
    };
  }
};

export const onGenerateFormClick = ({
  batchUpdateProperties,
  props,
}: OnButtonClickProps) => {
  const widgetProperties: JSONFormWidgetProps = props.widgetProperties;

  if (widgetProperties.autoGenerateForm) return;

  // TODO: Fix this the next time the file is edited
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const currSourceData = widgetProperties[EVALUATION_PATH]?.evaluatedValues
    ?.sourceData as Record<string, any> | Record<string, any>[];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const prevSourceData = widgetProperties.schema?.__root_schema__?.sourceData;

  const { dynamicPropertyPathList, schema, status } = computeSchema({
    currentDynamicPropertyPathList: widgetProperties.dynamicPropertyPathList,
    currSourceData,
    fieldThemeStylesheets: widgetProperties.childStylesheet,
    prevSchema: widgetProperties.schema,
    prevSourceData,
    widgetName: widgetProperties.widgetName,
    maxAllowedFields: widgetProperties.maxAllowedFields,
  });

  if (status === ComputedSchemaStatus.LIMIT_EXCEEDED) {
    batchUpdateProperties({ fieldLimitExceeded: true });

    return;
  }

  if (status === ComputedSchemaStatus.UNCHANGED) {
    if (widgetProperties.fieldLimitExceeded) {
      batchUpdateProperties({ fieldLimitExceeded: false });
    }

    return;
  }

  if (status === ComputedSchemaStatus.UPDATED) {
    batchUpdateProperties({
      dynamicPropertyPathList,
      schema,
      fieldLimitExceeded: false,
    });
  }
};

const generateFormCTADisabled = (widgetProps: JSONFormWidgetProps) =>
  widgetProps.autoGenerateForm;

export const contentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        propertyName: "sourceData",
        helpText: "Input JSON sample for default form layout",
        label: "Source data",
        controlType: "ONE_CLICK_BINDING_CONTROL",
        controlConfig: {
          showEditFieldsModal: true, // Shows edit field modals button in the datasource table control
          datasourceDropdownVariant: DROPDOWN_VARIANT.CREATE_OR_EDIT_RECORDS, // Decides the variant of the datasource dropdown which alters the text and some options
          actionButtonCtaText: createMessage(JSON_FORM_CONNECT_BUTTON_TEXT), // CTA text for the connect action button in property pane
          excludePrimaryColumnFromQueryGeneration: true, // Excludes the primary column from the query generation by default
          isConnectableToWidget: true, // Whether this widget can be connected to another widget like Table,List etc
          alertMessage: {
            success: {
              update: createMessage(SUCCESSFULL_BINDING_MESSAGE, "updated"),
            }, // Alert message to show when the binding is successful
          },
          /* other form config options like create or update flow, get default values from widget and data identifier to be used in the generated query as primary key*/
          otherFields: [
            {
              label: "Form Type",
              name: "formType",
              fieldType: FieldType.SELECT,
              optionType: FieldOptionsType.CUSTOM, // Dropdown options can be custom ( options provided by the widget config like Line 193 ) or widgets ( connectable widgets in the page ) or columns ( columns from the datasource )
              isRequired: true,
              getDefaultValue: () => {
                return "create";
              },
              allowClear: false, // whether the dropdown should have a clear option
              options: [
                {
                  label: "Create records",
                  value: "create",
                  id: "create",
                },
                {
                  label: "Edit records",
                  value: "edit",
                  id: "edit",
                },
              ],
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              isVisible: (config: Record<string, any>) => {
                // Whether the field should be visible or not based on the config
                return config?.tableName !== "";
              },
            },
            {
              label: "Get values from",
              name: "defaultValues",
              fieldType: FieldType.SELECT,
              optionType: FieldOptionsType.WIDGETS,
              isRequired: true,
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              isVisible: (config: Record<string, any>) => {
                return config?.otherFields?.formType === "edit";
              },
            },
            {
              label: "Data Identifier",
              name: "dataIdentifier",
              isDataIdentifier: true, // Whether the field is a data identifier or not
              fieldType: FieldType.SELECT,
              optionType: FieldOptionsType.COLUMNS,
              isRequired: true,
              getDefaultValue: (options: Record<string, unknown>) => {
                return options?.primaryColumn;
              },
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              isVisible: (config: Record<string, any>) => {
                return config?.otherFields?.formType === "edit";
              },
            },
          ],
        },
        isJSConvertible: true,
        placeholderText: '{ "name": "John", "age": 24 }',
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: sourceDataValidationFn,
            expected: {
              type: "JSON",
              example: `{ "name": "John Doe", "age": 29 }`,
              autocompleteDataType: AutocompleteDataType.OBJECT,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        propertyName: "autoGenerateForm",
        helpText:
          "Caution: When auto generate form is enabled, the form fields would regenerate if there is any change of source data (keys change or value type changes eg from string to number). If disabled then the fields and their configuration won't change with the change of source data.",
        label: "Auto generate form",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        customJSControl: "INPUT_TEXT",
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "generateFormButton",
        label: "",
        controlType: "BUTTON",
        isJSConvertible: false,
        isBindProperty: false,
        buttonLabel: "Generate form",
        onClick: onGenerateFormClick,
        isDisabled: generateFormCTADisabled,
        isTriggerProperty: false,
        dependencies: [
          "autoGenerateForm",
          "schema",
          "fieldLimitExceeded",
          "childStylesheet",
          "dynamicPropertyPathList",
        ],
        evaluatedDependencies: ["sourceData"],
      },
      {
        propertyName: `schema.${ROOT_SCHEMA_KEY}.children`,
        helpText: "Field configuration",
        label: "Field configuration",
        controlType: "FIELD_CONFIGURATION",
        isBindProperty: false,
        isTriggerProperty: false,
        panelConfig,
        dependencies: ["schema", "childStylesheet"],
      },
    ],
    expandedByDefault: true,
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "title",
        label: "Title",
        helpText: "Sets the title of the form",
        controlType: "INPUT_TEXT",
        placeholderText: "Update Order",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "isVisible",
        helpText: "Controls the visibility of the widget",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "useSourceData",
        helpText: "Use source data for hidden fields to show them in form data",
        label: "Hidden fields in data",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "animateLoading",
        label: "Animate loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "disabledWhenInvalid",
        helpText:
          "Disables the submit button when the parent form has a required widget that is not filled",
        label: "Disable when form is invalid",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "fixedFooter",
        helpText: "Makes the footer always stick to the bottom of the form",
        label: "Fixed Footer",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "scrollContents",
        helpText: "Allows scrolling of the form",
        label: "Scroll contents",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "showReset",
        helpText: "Show/hide reset form button",
        label: "Show reset",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "submitButtonLabel",
        helpText: "Changes the label of the submit button",
        label: "Submit button label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "resetButtonLabel",
        helpText: "Changes the label of the reset button",
        label: "Reset button label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "maxAllowedFields",
        label: "Max allowed fields",
        helperText:
          "⚠️ Warning: Increasing this value beyond 50 can severely impact performance and responsiveness",
        helpText:
          "Sets the maximum number of fields that can be generated in the form. Default value is 50 fields.",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: 1,
            max: 250,
            default: MAX_ALLOWED_FIELDS,
          },
        },
        placeholderText: "1-250",
      },
    ],
    expandedByDefault: false,
  },
  {
    sectionName: "Events",
    children: [
      {
        propertyName: "onSubmit",
        helpText: "when the submit button is clicked",
        label: "onSubmit",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
    expandedByDefault: false,
  },
];

const generateButtonStyleControlsV2For = (prefix: string) => [
  {
    sectionName: "General",
    collapsible: false,
    children: [
      {
        propertyName: `${prefix}.buttonColor`,
        helpText: "Changes the color of the button",
        label: "Button color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: `${prefix}.buttonVariant`,
        label: "Button variant",
        controlType: "ICON_TABS",
        defaultValue: ButtonVariantTypes.PRIMARY,
        fullWidth: true,
        helpText: "Sets the variant of the icon button",
        options: [
          {
            label: "Primary",
            value: ButtonVariantTypes.PRIMARY,
          },
          {
            label: "Secondary",
            value: ButtonVariantTypes.SECONDARY,
          },
          {
            label: "Tertiary",
            value: ButtonVariantTypes.TERTIARY,
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              ButtonVariantTypes.PRIMARY,
              ButtonVariantTypes.SECONDARY,
              ButtonVariantTypes.TERTIARY,
            ],
            default: ButtonVariantTypes.PRIMARY,
          },
        },
      },
      {
        propertyName: `${prefix}.borderRadius`,
        label: "Border radius",
        helpText: "Rounds the corners of the icon button's outer border edge",
        controlType: "BORDER_RADIUS_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: `${prefix}.boxShadow`,
        label: "Box shadow",
        helpText:
          "Enables you to cast a drop shadow from the frame of the widget",
        controlType: "BOX_SHADOW_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
        },
      },
    ],
  },
  {
    sectionName: "Icon",
    collapsible: false,
    children: [
      {
        propertyName: `${prefix}.iconName`,
        label: "Icon",
        helpText: "Sets the icon to be used for the button",
        controlType: "ICON_SELECT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        updateHook: (
          props: ButtonWidgetProps,
          propertyPath: string,
          propertyValue: string,
        ) => {
          const propertiesToUpdate = [{ propertyPath, propertyValue }];

          if (!props.iconAlign) {
            propertiesToUpdate.push({
              propertyPath: `${prefix}.iconAlign`,
              propertyValue: Alignment.LEFT,
            });
          }

          return propertiesToUpdate;
        },
        validation: {
          type: ValidationTypes.TEXT,
        },
      },
      {
        propertyName: `${prefix}.iconAlign`,
        label: "Position",
        helpText: "Sets the icon alignment of the button",
        controlType: "ICON_TABS",
        defaultValue: "left",
        fullWidth: false,
        options: [
          {
            startIcon: "skip-left-line",
            value: "left",
          },
          {
            startIcon: "skip-right-line",
            value: "right",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["center", "left", "right"],
          },
        },
      },
      {
        propertyName: `${prefix}.placement`,
        label: "Placement",
        controlType: "ICON_TABS",
        fullWidth: true,
        helpText: "Sets the space between items",
        options: [
          {
            label: "Start",
            value: ButtonPlacementTypes.START,
          },
          {
            label: "Between",
            value: ButtonPlacementTypes.BETWEEN,
          },
          {
            label: "Center",
            value: ButtonPlacementTypes.CENTER,
          },
        ],
        defaultValue: ButtonPlacementTypes.CENTER,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              ButtonPlacementTypes.START,
              ButtonPlacementTypes.BETWEEN,
              ButtonPlacementTypes.CENTER,
            ],
            default: ButtonPlacementTypes.CENTER,
          },
        },
      },
    ],
  },
];

export const styleConfig = [
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "backgroundColor",
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        label: "Background color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "borderColor",
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        label: "Border color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Border and shadow",
    children: [
      {
        propertyName: "borderWidth",
        helpText: "Enter value for border width",
        label: "Border width",
        placeholderText: "Enter value in px",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.NUMBER },
      },
      {
        propertyName: "borderRadius",
        helpText: "Enter value for border radius",
        label: "Border radius",
        controlType: "BORDER_RADIUS_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "boxShadow",
        label: "Box shadow",
        helpText:
          "Enables you to cast a drop shadow from the frame of the widget",
        controlType: "BOX_SHADOW_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Submit button styles",
    children: generateButtonStyleControlsV2For("submitButtonStyles"),
  },
  {
    sectionName: "Reset button styles",
    children: generateButtonStyleControlsV2For("resetButtonStyles"),
    dependencies: ["showReset"],
    hidden: (props: JSONFormWidgetProps) => !props.showReset,
  },
];
