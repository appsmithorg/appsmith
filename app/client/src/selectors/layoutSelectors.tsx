import type { AppState } from "@appsmith/reducers";
import type {
  LayoutComponentProps,
  LayoutConfig,
  LayoutConfigurations,
} from "utils/autoLayout/autoLayoutTypes";

export const getLayoutConfigById = (
  state: AppState,
  id: string,
): LayoutConfig | null => {
  return state.entities.layoutConfig[id]
    ? state.entities.layoutConfig[id]
    : null;
};

export const getLayoutConfig = (state: AppState): LayoutConfigurations =>
  state.entities.layoutConfig;

export const getLayoutConfigForPreset = (
  state: AppState,
  id: string,
): LayoutComponentProps[] | null => {
  const layoutConfig = getLayoutConfig(state);
  const config = layoutConfig[id];
  if (!config || !config.config || !config.config.layout) return null;
  return (config.config.layout as string[]).map(
    (each: string) => layoutConfig[each].config as LayoutComponentProps,
  );
};
