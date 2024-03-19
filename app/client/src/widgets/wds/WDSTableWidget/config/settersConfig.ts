export const settersConfig = {
  __setters: {
    setVisibility: {
      path: "isVisible",
      type: "string",
    },
    setSelectedRowIndex: {
      path: "defaultSelectedRowIndex",
      type: "number",
      disabled: "return options.entity.multiRowSelection",
    },
    setSelectedRowIndices: {
      path: "defaultSelectedRowIndices",
      type: "array",
      disabled: "return !options.entity.multiRowSelection",
    },
    setData: {
      path: "tableData",
      type: "array",
    },
  },
};
