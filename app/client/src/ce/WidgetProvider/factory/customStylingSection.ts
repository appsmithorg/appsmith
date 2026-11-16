/**
 * Lets an edition add a custom styling section to a widget's property pane config.
 * WidgetFactory calls it before it enhances the config, at two call sites:
 * - getWidgetPropertyPaneStyleConfig, with the widget's style config. The config
 *   is undefined when the widget has no style config.
 * - getWidgetPropertyPaneConfigWithMemo, with the older combined config, after
 *   the tab order section is added.
 *
 * Contract:
 * - WidgetFactory memoizes and freezes the result per widget type for the whole
 *   session. The output must depend only on the widget type and the config.
 * - Do not read runtime state, such as feature flags, the license, or the Redux store.
 *   A later change to that state would not reach the cached result.
 * - Never mutate the input config. To change it, return a new array.
 *   Returning the input unchanged is allowed.
 * - Do not import widget maps, because WidgetFactory imports this file.
 *
 * This file imports nothing, not even types. The cyclic dependency check also
 * counts type imports, and WidgetFactory imports this file. The config type
 * comes from the caller instead.
 *
 * CE returns the config unchanged.
 */
export const addCustomStylingSection = <TConfig>(
  type: string,
  config: TConfig,
): TConfig => config;
