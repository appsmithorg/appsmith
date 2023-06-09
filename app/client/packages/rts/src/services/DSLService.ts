import type { NestedDSL } from "@shared/dsl";
import { flattenDSLByName, unflattenDSLByName } from "@shared/dsl";

type DSLWidget = Record<string, any>;

export const getFlattenedDSLForGit = (nestedDSL: NestedDSL<DSLWidget>) => {
  const { entities } = flattenDSLByName(nestedDSL);

  const serializedWidgets = {};
  Object.keys(entities.canvasWidgets).forEach((widgetName) => {
    const widget = entities.canvasWidgets[widgetName];
    let sw: string;
    try {
      sw = JSON.stringify(widget);
    } catch (err) {
      throw new Error(`Widget is not a valid object`);
    }
    serializedWidgets[widgetName] = sw;
  });

  return serializedWidgets;
};

export const getNestedDSLFromGit = (flattenedDSL) => {
  const canvasWidgets = {};
  Object.keys(flattenedDSL).forEach((widgetName) => {
    const sw = flattenedDSL[widgetName];
    let widget;
    try {
      widget = JSON.parse(sw);
    } catch {
      throw new Error(`Widget structure is not valid`);
    }
    canvasWidgets[widgetName] = widget;
  });
  const entities = { canvasWidgets };

  const nestedDSL = unflattenDSLByName("MainContainer", entities);
  return nestedDSL;
};
