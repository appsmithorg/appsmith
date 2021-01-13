const PropertyPaneConfig = [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Takes in an array of objects to display items in the grid. Bind data from an API using {{}}",
        propertyName: "items",
        label: "Grid Items",
        controlType: "INPUT_TEXT",
        placeholderText: 'Enter [{ "col1": "val1" }]',
        inputType: "ARRAY",
      },
      {
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        propertyName: "backgroundColor",
        label: "Background Color",
        controlType: "INPUT_TEXT",
      },
      {
        helpText: "Gap between rows and columns",
        placeholderText: "0",
        propertyName: "gridGap",
        label: "Grid Gap",
        controlType: "INPUT_TEXT",
      },
      {
        propertyName: "shouldScrollContents",
        label: "Scroll Contents",
        controlType: "SWITCH",
      },
      {
        helpText: "Triggers an action when a grid list item is clicked",
        propertyName: "onGridItemClick",
        label: "onGridItemClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
      },
    ],
  },
];

export { PropertyPaneConfig as default };
