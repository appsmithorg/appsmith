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
    setPageNumber: {
      path: "pageNo",
      type: "number",
    },
    setData: {
      path: "tableData",
      type: "array",
    },
  },
};
