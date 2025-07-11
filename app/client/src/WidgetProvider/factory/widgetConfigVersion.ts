// Global version counter that increments when widgets are registered
let widgetConfigsVersion = 0;

// Export getter for selectors to depend on
export const getWidgetConfigsVersion = () => widgetConfigsVersion;

// Export incrementer for registration helper to use
export const incrementWidgetConfigsVersion = () => {
  widgetConfigsVersion++;
};
