import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { isAutoLayout } from "layoutSystems/autolayout/utils/flexWidgetUtils";
import type { CodeScannerWidgetProps } from "widgets/CodeScannerWidget/constants";
import { ScannerLayout } from "widgets/CodeScannerWidget/constants";
import {
  BACK_CAMERA_LABEL,
  DEFAULT_CAMERA_LABEL,
  DEFAULT_CAMERA_LABEL_DESCRIPTION,
  FRONT_CAMERA_LABEL,
  createMessage,
} from "ee/constants/messages";
import { DefaultMobileCameraTypes } from "WidgetProvider/constants";
export default [
  {
    sectionName: "Basic",
    children: [
      {
        propertyName: "scannerLayout",
        label: "Scanner layout",
        controlType: "ICON_TABS",
        defaultValue: ScannerLayout.ALWAYS_ON,
        fullWidth: true,
        helpText:
          'Sets how the code scanner will look and behave. If set to "Always on", the scanner will be visible and scanning all the time. If set to "Click to Scan", the scanner will pop up inside a modal and start scanning when the user clicks on the button.',
        options: [
          {
            label: "Always on",
            value: ScannerLayout.ALWAYS_ON,
          },
          {
            label: "Click to scan",
            value: ScannerLayout.CLICK_TO_SCAN,
          },
        ],
        hidden: isAutoLayout,
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
      },
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
        hidden: (props: CodeScannerWidgetProps) =>
          props.scannerLayout === ScannerLayout.ALWAYS_ON,
        dependencies: ["scannerLayout"],
      },
    ],
  },
  {
    sectionName: "General",
    children: [
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
        helpText: "Show helper text with button on hover",
        propertyName: "tooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "Add Input Field",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (props: CodeScannerWidgetProps) =>
          props.scannerLayout === ScannerLayout.ALWAYS_ON,
        dependencies: ["scannerLayout"],
      },
      {
        propertyName: "defaultCamera",
        label: createMessage(DEFAULT_CAMERA_LABEL),
        helpText: createMessage(DEFAULT_CAMERA_LABEL_DESCRIPTION),
        controlType: "DROP_DOWN",
        defaultValue: DefaultMobileCameraTypes.BACK,
        options: [
          {
            label: createMessage(FRONT_CAMERA_LABEL),
            value: DefaultMobileCameraTypes.FRONT,
          },
          {
            label: createMessage(BACK_CAMERA_LABEL),
            value: DefaultMobileCameraTypes.BACK,
          },
        ],
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              DefaultMobileCameraTypes.FRONT,
              DefaultMobileCameraTypes.BACK,
            ],
            default: DefaultMobileCameraTypes.BACK,
          },
        },
      },
    ],
  },

  {
    sectionName: "Events",
    children: [
      {
        helpText: "when a valid code is detected",
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
