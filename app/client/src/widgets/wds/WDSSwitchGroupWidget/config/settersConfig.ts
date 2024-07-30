export const settersConfig = {
  __setters: {
    setVisibility: {
      path: "isVisible",
      type: "boolean",
    },
    setDisabled: {
      path: "isDisabled",
      type: "boolean",
    },
    setSelectedOptions: {
      path: "defaultSelectedValues",
      type: "array",
      accessor: "selectedValues",
    },
  },
};
