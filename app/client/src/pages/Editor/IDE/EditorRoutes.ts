import { lazy } from "react";
import type { EditorRoute } from "./EditorPane/EditorPane.types";

export const jsSegmentRoutes = [
  "/js",
  "/js/new",
  "/js/:jsActionId",
  "/js/:jsActionId/settings",
];

export const querySegmentRoutes = [
  "/queries",
  "/queries/new",
  "/queries/:queryId",
  "/queries/:queryId/settings",
];

export const uiSegmentRoutes = [
  "/ui",
  "/ui/new",
  "/ui/:widgetId",
  "/ui/:widgetId/settings",
];

export const editorRoutes: EditorRoute[] = [
  {
    key: "js",
    path: "/js/*",
    exact: false,
    component: lazy(() => import("./EditorPane/JS").then((m) => ({ default: m.JSEditorPane }))),
  },
  {
    key: "query",
    path: "/queries/*",
    exact: false,
    component: lazy(() => import("./EditorPane/Query").then((m) => ({ default: m.QueryEditor }))),
  },
  {
    key: "ui",
    path: "/ui/*",
    exact: false,
    component: lazy(() => import("./EditorPane/UI").then((m) => ({ default: m.default }))),
  },
];
