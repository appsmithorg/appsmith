import { updateColumnStyles } from "../propertyUtils";

export default {
  sectionName: "Styles",
  children: [
    {
      propertyName: "cellBackground",
      label: "Cell Background Color",
      controlType: "COLOR_PICKER",
      updateHook: updateColumnStyles,
      dependencies: ["primaryColumns"],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "textColor",
      label: "Text Color",
      controlType: "COLOR_PICKER",
      updateHook: updateColumnStyles,
      dependencies: ["primaryColumns"],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "textSize",
      label: "Text Size",
      controlType: "DROP_DOWN",
      updateHook: updateColumnStyles,
      dependencies: ["primaryColumns"],
      options: [
        {
          label: "Heading 1",
          value: "HEADING1",
          subText: "24px",
          icon: "HEADING_ONE",
        },
        {
          label: "Heading 2",
          value: "HEADING2",
          subText: "18px",
          icon: "HEADING_TWO",
        },
        {
          label: "Heading 3",
          value: "HEADING3",
          subText: "16px",
          icon: "HEADING_THREE",
        },
        {
          label: "Paragraph",
          value: "PARAGRAPH",
          subText: "14px",
          icon: "PARAGRAPH",
        },
        {
          label: "Paragraph 2",
          value: "PARAGRAPH2",
          subText: "12px",
          icon: "PARAGRAPH_TWO",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "fontStyle",
      label: "Font Style",
      controlType: "BUTTON_TABS",
      updateHook: updateColumnStyles,
      dependencies: ["primaryColumns"],
      options: [
        {
          icon: "BOLD_FONT",
          value: "BOLD",
        },
        {
          icon: "ITALICS_FONT",
          value: "ITALIC",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "horizontalAlignment",
      label: "Text Align",
      controlType: "ICON_TABS",
      updateHook: updateColumnStyles,
      dependencies: ["primaryColumns"],
      options: [
        {
          icon: "LEFT_ALIGN",
          value: "LEFT",
        },
        {
          icon: "CENTER_ALIGN",
          value: "CENTER",
        },
        {
          icon: "RIGHT_ALIGN",
          value: "RIGHT",
        },
      ],
      defaultValue: "LEFT",
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "verticalAlignment",
      label: "Vertical Alignment",
      controlType: "ICON_TABS",
      updateHook: updateColumnStyles,
      dependencies: ["primaryColumns"],
      options: [
        {
          icon: "VERTICAL_TOP",
          value: "TOP",
        },
        {
          icon: "VERTICAL_CENTER",
          value: "CENTER",
        },
        {
          icon: "VERTICAL_BOTTOM",
          value: "BOTTOM",
        },
      ],
      defaultValue: "LEFT",
      isBindProperty: false,
      isTriggerProperty: false,
    },
  ],
};
