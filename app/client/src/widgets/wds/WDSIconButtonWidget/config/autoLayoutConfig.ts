export const autoLayoutConfig = {
  defaults: {
    rows: 4,
    columns: 2.21,
  },
  autoDimension: {
    width: true,
  },
  widgetSize: [
    {
      viewportMinWidth: 0,
      configuration: () => {
        return {
          minWidth: "40px",
          minHeight: "40px",
        };
      },
    },
  ],
  disableResizeHandles: {
    horizontal: true,
    vertical: true,
  },
};
