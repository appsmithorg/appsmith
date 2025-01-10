import { lazy } from "react";
import type { EditorRoute } from "./EditorPane/EditorPane.types";

// Centralize all route patterns to prevent duplication and ensure consistency
export const EditorRoutePatterns = {
  JS: {
    root: "/js",
    new: "/js/new",
    edit: "/js/:jsActionId",
    settings: "/js/:jsActionId/settings",
    all: "/js/*",
  },
  Query: {
    root: "/queries",
    new: "/queries/new",
    edit: "/queries/:queryId",
    settings: "/queries/:queryId/settings",
    all: "/queries/*",
  },
  UI: {
    root: "/ui",
    new: "/ui/new",
    edit: "/ui/:widgetId",
    settings: "/ui/:widgetId/settings",
    all: "/ui/*",
  },
} as const;

// Centralize lazy-loaded component imports
const EditorComponents = {
  JS: lazy(() => 
    import("./EditorPane/JS").then((m) => ({ default: m.JSEditorPane }))
  ),
  Query: lazy(() =>
    import("./EditorPane/Query").then((m) => ({ default: m.QueryEditor }))
  ),
  UI: lazy(() =>
    import("./EditorPane/UI").then((m) => ({ default: m.default }))
  ),
} as const;

// Export segment routes for backward compatibility
export const jsSegmentRoutes = [
  EditorRoutePatterns.JS.root,
  EditorRoutePatterns.JS.new,
  EditorRoutePatterns.JS.edit,
  EditorRoutePatterns.JS.settings,
];

export const querySegmentRoutes = [
  EditorRoutePatterns.Query.root,
  EditorRoutePatterns.Query.new,
  EditorRoutePatterns.Query.edit,
  EditorRoutePatterns.Query.settings,
];

export const uiSegmentRoutes = [
  EditorRoutePatterns.UI.root,
  EditorRoutePatterns.UI.new,
  EditorRoutePatterns.UI.edit,
  EditorRoutePatterns.UI.settings,
];

// Define routes using centralized patterns and components
export const editorRoutes: EditorRoute[] = [
  {
    key: "js",
    path: EditorRoutePatterns.JS.all,
    exact: false,
    component: EditorComponents.JS,
  },
  {
    key: "query",
    path: EditorRoutePatterns.Query.all,
    exact: false,
    component: EditorComponents.Query,
  },
  {
    key: "ui",
    path: EditorRoutePatterns.UI.all,
    exact: false,
    component: EditorComponents.UI,
  },
];
