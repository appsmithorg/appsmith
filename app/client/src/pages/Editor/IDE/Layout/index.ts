import { lazy } from "react";

// Re-export types only to prevent circular dependencies
export type { BaseLayoutProps, LayoutProps, Area } from "./Layout.types";

// Export layout components through dynamic imports
export const AnimatedLayout = lazy(() => import("./AnimatedLayout").then(m => ({ default: m.AnimatedLayout })));
export const StaticLayout = lazy(() => import("./StaticLayout").then(m => ({ default: m.StaticLayout })));
