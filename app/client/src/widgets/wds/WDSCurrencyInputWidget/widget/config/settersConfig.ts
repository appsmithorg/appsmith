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
    setReadOnly: {
      path: "isReadOnly",
      type: "boolean",
    },
    setValue: {
      path: "defaultText",
      type: "string",
      accessor: "text",
    },
  },
};
