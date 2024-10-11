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
    setValue: {
      path: "defaultSwitchState",
      type: "boolean",
      accessor: "isSwitchedOn",
    },
    setColor: {
      path: "accentColor",
      type: "string",
    },
  },
};
