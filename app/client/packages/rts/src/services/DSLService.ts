import { nestGitDSL, unnestGitDSL } from "@shared/dsl";

export const getFlattenedDSLForGit = (nestedDSL) => {
  const widgets = unnestGitDSL(nestedDSL);

  const serializedWidgets = {};
  Object.keys(widgets).forEach((widgetName) => {
    const widget = widgets[widgetName];
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
  const widgets = {};
  Object.keys(flattenedDSL).forEach((widgetName) => {
    const sw = flattenedDSL[widgetName];
    let widget;
    try {
      widget = JSON.parse(sw);
    } catch {
      throw new Error(`Widget structure is not valid`);
    }
    widgets[widgetName] = widget;
  });

  const nestedDSL = nestGitDSL(widgets);
  return nestedDSL;
};
