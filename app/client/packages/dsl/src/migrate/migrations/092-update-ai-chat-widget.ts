// This migration updates the ai chat widget to use dynamic bindings
// Earlier we had chatQuery which was a static field of the name of the query
// Now we have queryRun which is a dynamic binding path which points to the actionId of the query
// Old format: [QueryName]
// New format: {{[QueryName].actionId}}

import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateAIChatWidget = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type !== "WDS_AI_CHAT_WIDGET") return;

    const queryName = widget.chatQuery;

    if (!queryName) return;

    widget.queryRun = `{{${queryName}.actionId}}`;
    widget.dynamicBindingPathList = widget.dynamicBindingPathList
      .filter((path: string) => path !== "chatQuery")
      .concat({ key: "queryRun" });

    delete widget.chatQuery;
  });
};
