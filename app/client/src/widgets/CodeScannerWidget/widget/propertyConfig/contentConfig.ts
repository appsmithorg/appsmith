import { ValidationTypes } from "constants/WidgetValidation";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ScannerVariant } from "widgets/CodeScannerWidget/constants";

export default [
  {
    sectionName: "Label",
    children: [
      {
        propertyName: "label",
        label: "Text",
        controlType: "INPUT_TEXT",
        helpText: "Sets the label of the button",
        placeholderText: "Scan a QR/Barcode",
        inputType: "TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "scannerVariant",
        label: "Scanner Variant",
        controlType: "ICON_TABS",
        fullWidth: true,
        helpText: "Sets the variant of the code scanner",
        options: [
          {
            label: "Click to Scan",
            value: ScannerVariant.CLICK_TO_SCAN,
          },
          {
            label: "Always On",
            value: ScannerVariant.ALWAYS_ON,
          },
        ],
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Controls the visibility of the widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isDisabled",
        label: "Disabled",
        helpText: "Disables input to this widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "animateLoading",
        label: "Animate Loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Show helper text with button on hover",
        propertyName: "tooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "Add Input Field",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "Triggers an action when a valid code is detected",
        propertyName: "onCodeDetected",
        label: "onCodeDetected",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
] as PropertyPaneConfig[];
