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
    setRequired: {
      path: "isRequired",
      type: "boolean",
    },
    setOptions: {
      path: "options",
      type: "array",
    },
    setSelectedOption: {
      path: "defaultOptionValues",
      type: "array",
      accessor: "selectedOptionValues",
    },
  },
};
