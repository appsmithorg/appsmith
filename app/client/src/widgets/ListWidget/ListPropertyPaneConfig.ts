const PropertyPaneConfig = [
  {
    sectionName: "General",
    children: [
      {
        helpText:
          "Takes in an array of objects to display items in the grid. Bind data from an API using {{}}",
        propertyName: "items",
        label: "Grid Items",
        controlType: "INPUT_TEXT",
        placeholderText: 'Enter [{ "col1": "val1" }]',
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
      },
      {
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        propertyName: "backgroundColor",
        label: "Background Color",
        controlType: "INPUT_TEXT",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Gap between rows and columns",
        placeholderText: "0",
        propertyName: "gridGap",
        label: "Grid Gap",
        controlType: "NUMBER_INPUT",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "shouldScrollContents",
        label: "Scroll Contents",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Triggers an action when a grid list item is clicked",
        propertyName: "onGridItemClick",
        label: "onGridItemClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
];

export { PropertyPaneConfig as default };
