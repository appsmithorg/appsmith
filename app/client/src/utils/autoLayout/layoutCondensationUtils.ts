/* eslint-disable no-console */
import { generateReactKey } from "utils/generators";
import type {
  LayoutComponentProps,
  LayoutConfig,
  LayoutConfigurations,
  LayoutPreset,
} from "./autoLayoutTypes";
import store from "store";
import { addLayoutConfig } from "actions/layoutActions";
import StatBoxPreset from "components/designSystems/appsmith/autoLayout/layoutPresets/statBoxPreset";
import ModalPreset from "components/designSystems/appsmith/autoLayout/layoutPresets/modalPreset";

export function createLayoutTemplate(
  base: LayoutComponentProps,
  children: (string | string[] | string[][] | LayoutComponentProps)[],
): LayoutComponentProps {
  console.log("####", { children });
  return {
    ...base,
    layout: children.map(
      (each: string | string[] | string[][] | LayoutComponentProps) => {
        console.log("####", { each });
        if (typeof each === "string" || Array.isArray(each)) {
          // each => widgetId
          // return childTemplate if it exists
          if (base.childTemplate)
            return {
              ...base.childTemplate,
              layout: Array.isArray(each) ? each : [each],
              layoutId: generateReactKey(),
              parentId: base.layoutId,
            } as LayoutComponentProps;
          return each as string | string[];
        } else
          return {
            ...each,
            layoutId: each.layoutId || generateReactKey(),
            parentId: base.layoutId,
          } as LayoutComponentProps;
      },
    ),
  } as LayoutComponentProps;
}

export function buildPreset(
  preset: LayoutPreset,
  templates: LayoutComponentProps[],
) {
  const { children } = preset;
  const res: LayoutConfigurations = {
    [preset.layoutId]: {
      role: "preset",
      config: {
        ...preset,
        layout: [],
      },
    },
  };
  const layout: string[] = children.map(
    (
      each: (string | string[] | string[][] | LayoutComponentProps)[],
      index: number,
    ) => {
      const data: LayoutComponentProps = createLayoutTemplate(
        {
          ...templates[index],
          layoutId: generateReactKey(),
          parentId: preset.layoutId,
          containerProps: preset.containerProps,
          childrenMap: preset.childrenMap,
        },
        each,
      );
      res[data.layoutId] = {
        role: "layout",
        config: data,
      } as LayoutConfig;
      return data.layoutId;
    },
  );
  res[preset.layoutId].config.layout = layout;
  store.dispatch(addLayoutConfig(res));
}

export function getLayoutPreset(type: string) {
  const map: { [id: string]: any } = {
    MODAL: ModalPreset,
    STATBOX: StatBoxPreset,
  };
  return map[type];
}
