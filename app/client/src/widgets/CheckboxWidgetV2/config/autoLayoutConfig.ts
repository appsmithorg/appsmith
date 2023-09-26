export const autoLayoutConfig = {
  disabledPropsDefaults: {
    labelTextSize: "0.875rem",
  },
  widgetSize: [
    {
      viewportMinWidth: 0,
      configuration: () => {
        return {
          minWidth: "120px",
          minHeight: "40px",
        };
      },
    },
  ],
  disableResizeHandles: {
    vertical: true,
  },
};
