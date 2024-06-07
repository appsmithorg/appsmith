import { ValidationTypes } from "constants/WidgetValidation";
import type { ModalWidgetProps } from "../../widget/types";

export const propertyPaneContentConfig = [
  {
    sectionName: "General",
    children: [
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
        propertyName: "size",
        label: "Size",
        helpText: "Size of the modal",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Small",
            value: "small",
          },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Header",
    children: [
      {
        propertyName: "showHeader",
        label: "Header",
        helpText: "Show or hide the header",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "title",
        label: "Title",
        helpText: "Title of the modal",
        controlType: "INPUT_TEXT",
        hidden: (props: ModalWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        isBindProperty: false,
        isTriggerProperty: false,
        placeholderText: "Record details",
      },
    ],
  },
  {
    sectionName: "Footer",
    children: [
      {
        propertyName: "showFooter",
        label: "Footer",
        helpText: "Show or hide the footer",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "showSubmitButton",
        label: "Submit",
        helpText: "Show or hide the submit button",
        controlType: "SWITCH",
        hidden: (props: ModalWidgetProps) => !props.showFooter,
        dependencies: ["showFooter"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "submitButtonText",
        label: "Submit Button Text",
        helpText: "Label for the Submit Button",
        controlType: "INPUT_TEXT",
        hidden: (props: ModalWidgetProps) =>
          !props.showSubmitButton || !props.showFooter,
        dependencies: ["showSubmitButton", "showFooter"],
        isBindProperty: false,
        isTriggerProperty: false,
        placeholderText: "Submit",
      },

      {
        propertyName: "cancelButtonText",
        label: "Cancel Button Text",
        helpText: "Label for the Cancel Button",
        controlType: "INPUT_TEXT",
        hidden: (props: ModalWidgetProps) => !props.showFooter,
        dependencies: ["showCancelButton", "showFooter"],
        isBindProperty: false,
        isTriggerProperty: false,
        placeholderText: "Cancel",
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "Trigger an action when the modal is closed",
        propertyName: "onClose",
        label: "onClose",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        propertyName: "closeOnSubmit",
        label: "Close on submit",
        helpText:
          "Set the modal to automatically close on submit button click. Note: If an action is configured for the onSubmit action, it would be ideal to toggle this off and configure a 'Close Modal' action in the onSuccess and/or onFailure callback of the onSubmit action",
        controlType: "SWITCH",
        hidden: (props: ModalWidgetProps) =>
          !props.showFooter || !props.showSubmitButton,
        dependencies: ["showFooter", "showSubmitButton"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Trigger an action when the submit button is pressed",
        propertyName: "onSubmit",
        hidden: (props: ModalWidgetProps) =>
          !props.showFooter || !props.showSubmitButton,
        dependencies: ["showSubmitButton", "showFooter"],
        label: "onSubmit",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];
