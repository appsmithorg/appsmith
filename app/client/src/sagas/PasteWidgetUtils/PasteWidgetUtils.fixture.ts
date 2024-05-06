export const widget = {
    image: "{{table1.selectedRowData.image}}",
    text: "{{table1.selectedRowData.name}}",
    sourceData: "{{table1.selectedRowData.sourceData}}",
  },
  expectedImageUpdate = {
    image: "{{table1Copy.selectedRowData.image}}",
    text: "{{table1.selectedRowData.name}}",
    sourceData: "{{table1.selectedRowData.sourceData}}",
  },
  expectedTextUpdate = {
    image: "{{table1.selectedRowData.image}}",
    text: "{{table1Copy.selectedRowData.name}}",
    sourceData: "{{table1.selectedRowData.sourceData}}",
  },
  expectedSourceDataUpdate = {
    image: "{{table1.selectedRowData.image}}",
    text: "{{table1.selectedRowData.name}}",
    sourceData: "{{table1Copy.selectedRowData.sourceData}}",
  },
  widget2 = {
    image: "{{table2.selectedRowData.image}}",
    text: "{{table2.selectedRowData.name}}",
    sourceData: "{{table2.selectedRowData.sourceData}}",
  },
  emptywidget = {
    image: "",
    text: "",
    sourceData: "",
  };
