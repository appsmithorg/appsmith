/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, set } from "lodash";
import type { DSLWidget } from "../types";

export const addLogBlackListToAllListWidgetChildren = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((children: DSLWidget) => {
    if (children.type === "LIST_WIDGET") {
      const widgets = get(
        children,
        "children.0.children.0.children.0.children",
      );

      widgets.map((widget: any, index: number) => {
        const logBlackList: { [key: string]: boolean } = {};

        Object.keys(widget).map((key) => {
          logBlackList[key] = true;
        });

        if (!widget.logBlackList) {
          set(
            children,
            `children.0.children.0.children.0.children.${index}.logBlackList`,
            logBlackList,
          );
        }
      });
    }

    return children;
  });

  return currentDSL;
};
